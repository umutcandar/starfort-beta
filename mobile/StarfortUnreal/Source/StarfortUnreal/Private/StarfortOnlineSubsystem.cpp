#include "StarfortOnlineSubsystem.h"
#include "StarfortOnlineSettings.h"
#include "Dom/JsonObject.h"
#include "Dom/JsonValue.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Misc/DateTime.h"
#include "Misc/Guid.h"
#include "Containers/Set.h"

namespace StarfortOnline
{
static constexpr int64 MaxResources = 1000000000;
static const TCHAR* AllowedHost = TEXT("https://ftbbzqzgafmallrfimnt.supabase.co");
static const TCHAR* BuildingIds[] = {
 TEXT("keep"), TEXT("farm"), TEXT("lumber"), TEXT("quarry"),
 TEXT("forge"), TEXT("tavern"), TEXT("observatory")
};
static const TCHAR* BuildingTitles[] = {
 TEXT("Karargâh"), TEXT("Çiftlik"), TEXT("Kereste Atölyesi"),
 TEXT("Taş Ocağı"), TEXT("Demirhane"), TEXT("Han"), TEXT("Gözlemevi")
};
static const TCHAR* HeroIds[] = {
 TEXT("aldren"), TEXT("lyra"), TEXT("rovan"), TEXT("mira"),
 TEXT("doran"), TEXT("vesper"), TEXT("eira")
};
static bool IsIntegerField(const TSharedPtr<FJsonObject>& Data, const TCHAR* Key,
 int64 Min, int64 Max, int64& Out)
{
 if (!Data.IsValid()) return false;
 double N=0;
 if (!Data->TryGetNumberField(Key,N) || !FMath::IsFinite(N) ||
     FMath::FloorToDouble(N)!=N || N<static_cast<double>(Min) ||
     N>static_cast<double>(Max)) return false;
 Out=static_cast<int64>(N);
 return true;
}
static bool IsServer(const TSharedPtr<FJsonObject>& Root)
{
 bool Ok=false;
 FString Source;
 return Root.IsValid() && Root->TryGetBoolField(TEXT("ok"),Ok) && Ok &&
  Root->TryGetStringField(TEXT("source"),Source) && Source==TEXT("server");
}
static bool IsValidId(const FString& Value)
{
 FGuid Parsed;
 return FGuid::Parse(Value,Parsed);
}
static FString ToJson(const TSharedPtr<FJsonObject>& Data)
{
 FString Body;
 const TSharedRef<TJsonWriter<>> Writer=TJsonWriterFactory<>::Create(&Body);
 FJsonSerializer::Serialize(Data.ToSharedRef(),Writer);
 return Body;
}
static TSharedPtr<FJsonObject> NewRpc(const FString& Action,
 const FString& TargetField, const FString& Target)
{
 const TSharedPtr<FJsonObject> Data=MakeShared<FJsonObject>();
 Data->SetStringField(TEXT("p_action"),Action);
 if (!TargetField.IsEmpty() && !Target.IsEmpty())
  Data->SetStringField(TargetField,Target);
 return Data;
}
}

void UStarfortOnlineSubsystem::Deinitialize()
{
 SignOut();
 Super::Deinitialize();
}
bool UStarfortOnlineSubsystem::ValidateConfig() const
{
 const UStarfortOnlineSettings* Settings=GetDefault<UStarfortOnlineSettings>();
 // Fixed allowlist ensures a misconfigured URL cannot receive player passwords or JWTs.
 return Settings &&
  Settings->SupabaseUrl.Equals(StarfortOnline::AllowedHost, ESearchCase::CaseSensitive) &&
  Settings->PublishableKey.StartsWith(TEXT("sb_publishable_")) &&
  Settings->PublishableKey.Len()<256;
}
void UStarfortOnlineSubsystem::Fail(const TCHAR* SafeMessage)
{
 // Deliberately omit response bodies, credentials, user identifiers and tokens.
 OnFailure.Broadcast(FString(SafeMessage));
}
void UStarfortOnlineSubsystem::RequestJson(const FString& Path, const FString& Verb,
 const FString& JsonBody, const FString& Bearer,
 TFunction<void(bool,const TSharedPtr<FJsonObject>&)> OnDone)
{
 if (!ValidateConfig() || !Path.StartsWith(TEXT("/auth/v1/")) &&
                            !Path.StartsWith(TEXT("/rest/v1/rpc/")))
 {
  OnDone(false,nullptr);
  return;
 }
 const UStarfortOnlineSettings* Settings=GetDefault<UStarfortOnlineSettings>();
 const TSharedRef<IHttpRequest,ESPMode::ThreadSafe> Request=FHttpModule::Get().CreateRequest();
 Request->SetURL(Settings->SupabaseUrl+Path);
 Request->SetVerb(Verb);
 Request->SetHeader(TEXT("apikey"),Settings->PublishableKey);
 Request->SetHeader(TEXT("Accept"),TEXT("application/json"));
 Request->SetHeader(TEXT("Content-Type"),TEXT("application/json"));
 if (!Bearer.IsEmpty()) Request->SetHeader(TEXT("Authorization"),TEXT("Bearer ")+Bearer);
 Request->SetTimeout(20.0f);
 if (!JsonBody.IsEmpty()) Request->SetContentAsString(JsonBody);
 const uint64 ThisGeneration=SessionGeneration;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 const TSharedRef<TFunction<void(bool,const TSharedPtr<FJsonObject>&)>> Completion=
  MakeShared<TFunction<void(bool,const TSharedPtr<FJsonObject>&)>>(MoveTemp(OnDone));
 Request->OnProcessRequestComplete().BindLambda(
  [WeakThis,ThisGeneration,Completion](FHttpRequestPtr Req,
     FHttpResponsePtr Response,bool bTransportOk)
  {
   if (!WeakThis.IsValid() || WeakThis->SessionGeneration!=ThisGeneration) return;
   TSharedPtr<FJsonObject> Root;
   bool bOk=bTransportOk && Response.IsValid();
   if (bOk)
   {
    const int32 Status=Response->GetResponseCode();
    const FString Content=Response->GetContentAsString();
    bOk=Status>=200 && Status<300 && Content.Len()<=524288;
    if (bOk)
    {
     const TSharedRef<TJsonReader<>> Reader=TJsonReaderFactory<>::Create(Content);
     bOk=FJsonSerializer::Deserialize(Reader,Root) && Root.IsValid();
    }
   }
   (*Completion)(bOk,Root);
  });
 if (!Request->ProcessRequest())
 {
  (*Completion)(false,nullptr);
 }
}
void UStarfortOnlineSubsystem::SignOut()
{
 ++SessionGeneration; // Drop any late HTTP responses from a prior identity.
 AccessToken.Empty();
 RefreshToken.Empty();
 UserId.Empty();
 ExpiresAtUnix=0;
 bSignInPending=false;
 bRefreshPending=false;
 bVillagePending=false;
 bProgressPending=false;
 RefreshWaiters.Reset();
 OnSignedOut.Broadcast();
}

void UStarfortOnlineSubsystem::SignIn(const FString& Email, const FString& Password)
{
 if (bSignInPending) return;
 if (!ValidateConfig() || Email.Len()<5 || Email.Len()>254 ||
     !Email.Contains(TEXT("@")) || Password.Len()<8 || Password.Len()>128)
 {
  Fail(TEXT("Giriş bilgileri geçersiz veya sunucu yapılandırması eksik."));
  return;
 }
 // New account identities never inherit a previous user's in-flight response.
 SignOut();
 bSignInPending=true;
 const uint64 StartGeneration=SessionGeneration;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 const TSharedPtr<FJsonObject> Body=MakeShared<FJsonObject>();
 Body->SetStringField(TEXT("email"),Email);
 Body->SetStringField(TEXT("password"),Password);
 RequestJson(TEXT("/auth/v1/token?grant_type=password"),TEXT("POST"),
  StarfortOnline::ToJson(Body),TEXT(""),
  [WeakThis,StartGeneration](bool bOk,const TSharedPtr<FJsonObject>& Root)
  {
   if (!WeakThis.IsValid() || WeakThis->SessionGeneration!=StartGeneration) return;
   FString CandidateAccess,CandidateRefresh,ClaimedUid;
   double Lifetime=0;
   const TSharedPtr<FJsonObject> User=Root.IsValid() &&
    Root->HasTypedField<EJson::Object>(TEXT("user"))
    ? Root->GetObjectField(TEXT("user")) : nullptr;
   const bool bValid=bOk && Root.IsValid() && User.IsValid() &&
    Root->TryGetStringField(TEXT("access_token"),CandidateAccess) &&
    Root->TryGetStringField(TEXT("refresh_token"),CandidateRefresh) &&
    Root->TryGetNumberField(TEXT("expires_in"),Lifetime) &&
    User->TryGetStringField(TEXT("id"),ClaimedUid) &&
    StarfortOnline::IsValidId(ClaimedUid) &&
    CandidateAccess.Len()>20 && CandidateRefresh.Len()>20 &&
    Lifetime>=60 && Lifetime<=86400;
   if (!bValid)
   {
    WeakThis->bSignInPending=false;
    WeakThis->Fail(TEXT("Hesap girişi doğrulanamadı."));
    return;
   }
   // A password token is not trusted until Supabase /auth/v1/user confirms it.
   WeakThis->RequestJson(TEXT("/auth/v1/user"),TEXT("GET"),TEXT(""),
    CandidateAccess,
    [WeakThis,StartGeneration,CandidateAccess,CandidateRefresh,ClaimedUid,Lifetime](
      bool bUserOk,const TSharedPtr<FJsonObject>& VerifiedUser)
    {
     if (!WeakThis.IsValid() || WeakThis->SessionGeneration!=StartGeneration) return;
     FString ConfirmedUid;
     if (!bUserOk || !VerifiedUser.IsValid() ||
         !VerifiedUser->TryGetStringField(TEXT("id"),ConfirmedUid) ||
         ConfirmedUid!=ClaimedUid)
     {
      WeakThis->bSignInPending=false;
      WeakThis->Fail(TEXT("Oturum kimliği doğrulanamadı."));
      return;
     }
     WeakThis->AccessToken=CandidateAccess;
     WeakThis->RefreshToken=CandidateRefresh;
     WeakThis->UserId=ClaimedUid;
     WeakThis->ExpiresAtUnix=FDateTime::UtcNow().ToUnixTimestamp()+
      static_cast<int64>(Lifetime);
     WeakThis->bSignInPending=false;
     WeakThis->OnSignedIn.Broadcast(WeakThis->UserId);
    });
  });
}
void UStarfortOnlineSubsystem::FinishRefresh(bool bSuccess)
{
 bRefreshPending=false;
 TArray<TFunction<void(bool)>> Callbacks=MoveTemp(RefreshWaiters);
 RefreshWaiters.Reset();
 for (TFunction<void(bool)>& Callback:Callbacks)
  if (Callback) Callback(bSuccess);
}
void UStarfortOnlineSubsystem::WithFreshSession(TFunction<void(bool)> OnReady)
{
 if (!IsSignedIn() || RefreshToken.IsEmpty())
 {
  OnReady(false);
  return;
 }
 const int64 Now=FDateTime::UtcNow().ToUnixTimestamp();
 if (ExpiresAtUnix>Now+60)
 {
  OnReady(true);
  return;
 }
 RefreshWaiters.Add(MoveTemp(OnReady));
 if (bRefreshPending) return;
 bRefreshPending=true;
 const uint64 StartGeneration=SessionGeneration;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 const TSharedPtr<FJsonObject> Payload=MakeShared<FJsonObject>();
 Payload->SetStringField(TEXT("refresh_token"),RefreshToken);
 RequestJson(TEXT("/auth/v1/token?grant_type=refresh_token"),TEXT("POST"),
  StarfortOnline::ToJson(Payload),TEXT(""),
  [WeakThis,StartGeneration](bool bOk,const TSharedPtr<FJsonObject>& Root)
  {
   if (!WeakThis.IsValid() || WeakThis->SessionGeneration!=StartGeneration) return;
   FString NewAccess,NewRefresh,ReturnedId;
   double Lifetime=0;
   const TSharedPtr<FJsonObject> NewUser=Root.IsValid() &&
    Root->HasTypedField<EJson::Object>(TEXT("user"))
    ? Root->GetObjectField(TEXT("user")) : nullptr;
   const bool bValid=bOk && Root.IsValid() && NewUser.IsValid() &&
     Root->TryGetStringField(TEXT("access_token"),NewAccess) &&
     Root->TryGetStringField(TEXT("refresh_token"),NewRefresh) &&
     Root->TryGetNumberField(TEXT("expires_in"),Lifetime) &&
     NewUser->TryGetStringField(TEXT("id"),ReturnedId) &&
     ReturnedId==WeakThis->UserId &&
     NewAccess.Len()>20 && NewRefresh.Len()>20 &&
     Lifetime>=60 && Lifetime<=86400;
   if (!bValid)
   {
    WeakThis->FinishRefresh(false);
    WeakThis->SignOut();
    WeakThis->Fail(TEXT("Oturum süresi doldu. Tekrar giriş yap."));
    return;
   }
   WeakThis->AccessToken=NewAccess;
   WeakThis->RefreshToken=NewRefresh;
   WeakThis->ExpiresAtUnix=FDateTime::UtcNow().ToUnixTimestamp()+
    static_cast<int64>(Lifetime);
   WeakThis->FinishRefresh(true);
  });
}
bool UStarfortOnlineSubsystem::ParseVillage(const TSharedPtr<FJsonObject>& Root,
 const FString& AuthenticatedUserId,FStarfortVerifiedVillage& Out)
{
 using namespace StarfortOnline;
 if (!IsServer(Root) || !IsValidId(AuthenticatedUserId) ||
     !Root->HasTypedField<EJson::Object>(TEXT("res")) ||
     !Root->HasTypedField<EJson::Object>(TEXT("buildings"))) return false;
 int64 Revision=0;
 if (!IsIntegerField(Root,TEXT("revision"),0,INT64_MAX,Revision)) return false;
 const TSharedPtr<FJsonObject> Res=Root->GetObjectField(TEXT("res"));
 const TSharedPtr<FJsonObject> Buildings=Root->GetObjectField(TEXT("buildings"));
 if (!Res.IsValid() || !Buildings.IsValid()) return false;
 if (!IsIntegerField(Res,TEXT("gold"),0,MaxResources,Out.Gold) ||
     !IsIntegerField(Res,TEXT("wood"),0,MaxResources,Out.Wood) ||
     !IsIntegerField(Res,TEXT("stone"),0,MaxResources,Out.Stone) ||
     !IsIntegerField(Res,TEXT("aether"),0,MaxResources,Out.StarEssence)) return false;
 const bool bConstructionActive=Root->HasTypedField<EJson::Object>(TEXT("construction"));
 Out.Buildings.Empty();
 for (int32 i=0;i<UE_ARRAY_COUNT(BuildingIds);++i)
 {
  int64 Level=0;
  if (!IsIntegerField(Buildings,BuildingIds[i],1,20,Level)) return false;
  FStarfortVerifiedBuilding Item;
  Item.BuildingId=FName(BuildingIds[i]);
  Item.Name=FText::FromString(BuildingTitles[i]);
  Item.Level=static_cast<int32>(Level);
  Item.MaxLevel=20;
  // Appearance-level eligibility only. Price and construction locks
  // remain exclusively checked by the server's "upgrade" RPC.
  Item.bServerAllowsUpgrade=!bConstructionActive && Level<20;
  Out.Buildings.Add(Item);
 }
 Out.VillageId=AuthenticatedUserId;
 Out.VillageName=FText::FromString(TEXT("Komutanın Kalesi"));
 Out.bServerVerified=true; // Only set after authenticated RPC + schema checks.
 return true;
}
bool UStarfortOnlineSubsystem::ParseProgress(const TSharedPtr<FJsonObject>& Root,
 FStarfortProgressSummary& Out)
{
 using namespace StarfortOnline;
 if (!IsServer(Root) || !Root->HasTypedField<EJson::Object>(TEXT("heroes")) ||
     !Root->HasTypedField<EJson::Array>(TEXT("team"))) return false;
 const TSharedPtr<FJsonObject> Heroes=Root->GetObjectField(TEXT("heroes"));
 if (!Heroes.IsValid() || Heroes->Values.Num()>UE_ARRAY_COUNT(HeroIds)) return false;
 TSet<FString> Known;
 for(const TCHAR* HeroId:HeroIds) Known.Add(FString(HeroId));
 for(const auto& Field:Heroes->Values)
 {
  int64 Level=0;
  if (!Known.Contains(Field.Key) ||
      !IsIntegerField(Heroes,*Field.Key,1,20,Level)) return false;
  Out.HeroLevels.Add(Field.Key,static_cast<int32>(Level));
 }
 const TArray<TSharedPtr<FJsonValue>>& Team=Root->GetArrayField(TEXT("team"));
 if (Team.Num()!=3) return false;
 TSet<FString> UniqueTeam;
 for(const TSharedPtr<FJsonValue>& Item:Team)
 {
  FString Id;
  if(!Item.IsValid() || !Item->TryGetString(Id) ||
     !Out.HeroLevels.Contains(Id) || UniqueTeam.Contains(Id)) return false;
  Out.Team.Add(Id);
  UniqueTeam.Add(Id);
 }
 if (Root->HasTypedField<EJson::Object>(TEXT("mission")))
 {
  const TSharedPtr<FJsonObject> Mission=Root->GetObjectField(TEXT("mission"));
  int64 Turn=0,PlayerHp=0,EnemyHp=0;
  if (!IsIntegerField(Mission,TEXT("turn"),0,36,Turn) ||
      !IsIntegerField(Mission,TEXT("playerHp"),0,100000,PlayerHp) ||
      !IsIntegerField(Mission,TEXT("enemyHp"),0,100000,EnemyHp))
   return false;
  Out.bInMission=true;
  Out.MissionTurn=static_cast<int32>(Turn);
  Out.PlayerHP=PlayerHp;
  Out.EnemyHP=EnemyHp;
 }
 Out.bServerVerified=true;
 return true;
}
void UStarfortOnlineSubsystem::LoadVillage()
{
 if (bVillagePending) return;
 bVillagePending=true;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 WithFreshSession([WeakThis](bool Ready)
 {
  if(!WeakThis.IsValid()) return;
  if (!Ready)
  {
   WeakThis->bVillagePending=false;
   WeakThis->Fail(TEXT("Köy için oturum gerekli."));
   return;
  }
  const TSharedPtr<FJsonObject> Body=MakeShared<FJsonObject>();
  Body->SetStringField(TEXT("p_action"),TEXT("get"));
  Body->SetField(TEXT("p_building"),MakeShared<FJsonValueNull>());
  Body->SetField(TEXT("p_request_id"),MakeShared<FJsonValueNull>());
  Body->SetField(TEXT("p_room_id"),MakeShared<FJsonValueNull>());
  WeakThis->RequestJson(TEXT("/rest/v1/rpc/sfb_village_api"),TEXT("POST"),
   StarfortOnline::ToJson(Body),WeakThis->AccessToken,
   [WeakThis](bool Ok,const TSharedPtr<FJsonObject>& Root)
   {
    if(!WeakThis.IsValid()) return;
    WeakThis->bVillagePending=false;
    FStarfortVerifiedVillage Snapshot;
    if (!Ok || !ParseVillage(Root,WeakThis->UserId,Snapshot))
    {
     WeakThis->Fail(TEXT("Köy verisi alınamadı veya doğrulanamadı."));
     return;
    }
    WeakThis->OnVillageReady.Broadcast(Snapshot);
   });
 });
}
void UStarfortOnlineSubsystem::RequestVillageUpgrade(FName BuildingId)
{
 using namespace StarfortOnline;
 if (bVillagePending || BuildingId.IsNone()) return;
 bool Allowed=false;
 for (const TCHAR* AllowedId:BuildingIds)
  if (BuildingId==FName(AllowedId)) { Allowed=true; break; }
 if(!Allowed)
 {
  Fail(TEXT("Geçersiz bina kimliği."));
  return;
 }
 bVillagePending=true;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 WithFreshSession([WeakThis,BuildingId](bool Ready)
 {
  if(!WeakThis.IsValid()) return;
  if(!Ready)
  {
   WeakThis->bVillagePending=false;
   WeakThis->Fail(TEXT("Bina geliştirme için oturum gerekli."));
   return;
  }
  const TSharedPtr<FJsonObject> Body=MakeShared<FJsonObject>();
  Body->SetStringField(TEXT("p_action"),TEXT("upgrade"));
  Body->SetStringField(TEXT("p_building"),BuildingId.ToString());
  Body->SetStringField(TEXT("p_request_id"),
   FGuid::NewGuid().ToString(EGuidFormats::DigitsWithHyphens));
  Body->SetField(TEXT("p_room_id"),MakeShared<FJsonValueNull>());
  WeakThis->RequestJson(TEXT("/rest/v1/rpc/sfb_village_api"),TEXT("POST"),
   StarfortOnline::ToJson(Body),WeakThis->AccessToken,
   [WeakThis](bool Ok,const TSharedPtr<FJsonObject>& Root)
   {
    if(!WeakThis.IsValid()) return;
    WeakThis->bVillagePending=false;
    FStarfortVerifiedVillage Snapshot;
    if(!Ok || !ParseVillage(Root,WeakThis->UserId,Snapshot))
    {
     // Outcome can be unknown on network failure: do not retry with a new id.
     WeakThis->Fail(TEXT("Geliştirme doğrulanamadı. Önce köyü yenile."));
     return;
    }
    WeakThis->OnVillageReady.Broadcast(Snapshot);
   });
 });
}
void UStarfortOnlineSubsystem::LoadProgress()
{
 if (bProgressPending) return;
 bProgressPending=true;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 WithFreshSession([WeakThis](bool Ready)
 {
  if(!WeakThis.IsValid()) return;
  if(!Ready)
  {
   WeakThis->bProgressPending=false;
   WeakThis->Fail(TEXT("Kahraman verisi için oturum gerekli."));
   return;
  }
  const TSharedPtr<FJsonObject> Body=MakeShared<FJsonObject>();
  Body->SetStringField(TEXT("p_action"),TEXT("get"));
  Body->SetField(TEXT("p_target"),MakeShared<FJsonValueNull>());
  Body->SetField(TEXT("p_aux"),MakeShared<FJsonValueNull>());
  Body->SetField(TEXT("p_request_id"),MakeShared<FJsonValueNull>());
  WeakThis->RequestJson(TEXT("/rest/v1/rpc/sfb_starfort_progress"),TEXT("POST"),
   StarfortOnline::ToJson(Body),WeakThis->AccessToken,
   [WeakThis](bool Ok,const TSharedPtr<FJsonObject>& Root)
   {
    if(!WeakThis.IsValid()) return;
    WeakThis->bProgressPending=false;
    FStarfortProgressSummary Snapshot;
    if(!Ok || !ParseProgress(Root,Snapshot))
    {
     WeakThis->Fail(TEXT("Kahraman ilerlemesi doğrulanamadı."));
     return;
    }
    WeakThis->OnProgressReady.Broadcast(Snapshot);
   });
 });
}
