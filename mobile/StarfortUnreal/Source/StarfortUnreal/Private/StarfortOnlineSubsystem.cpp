#include "StarfortOnlineSubsystem.h"
#include "StarfortOnlineSettings.h"
#include "StarfortBagCatalog.h"
#include "Dom/JsonObject.h"
#include "Dom/JsonValue.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Misc/DateTime.h"
#include "Misc/Guid.h"
#include "Misc/DefaultValueHelper.h"
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
static bool IsDateOnly(const FString& Date)
{
 if (Date.Len()!=10 || Date[4]!=TEXT('-') || Date[7]!=TEXT('-')) return false;
 for (int32 I=0;I<10;++I)
  if (I!=4 && I!=7 && !FChar::IsDigit(Date[I])) return false;
 return true;
}
static bool IsBuildingId(const FString& Id)
{
 for (const TCHAR* Allowed : BuildingIds)
  if (Id==Allowed) return true;
 return false;
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
 bLastProgressValid=false;
 LastMissionId.Empty(); LastMissionTurn=-1; LastEnemyHP=0; LastPlayerHP=0;
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
 int64 Revision=0, ServerNow=0, LastCollected=0, Mastery=0;
 if (!IsIntegerField(Root,TEXT("revision"),0,INT64_MAX,Revision) ||
     !IsIntegerField(Root,TEXT("serverNow"),0,9007199254740991LL,ServerNow) ||
     !IsIntegerField(Root,TEXT("lastCollected"),0,9007199254740991LL,LastCollected) ||
     !IsIntegerField(Root,TEXT("mastery"),0,24,Mastery)) return false;
 if (!Root->HasField(TEXT("construction")) ||
     !Root->HasField(TEXT("lastDailyReward"))) return false;
 if (!Root->HasTypedField<EJson::Null>(TEXT("lastDailyReward")))
 {
  FString Daily;
  if (!Root->TryGetStringField(TEXT("lastDailyReward"),Daily) ||
      !IsDateOnly(Daily)) return false;
 }
 const TSharedPtr<FJsonObject> Res=Root->GetObjectField(TEXT("res"));
 const TSharedPtr<FJsonObject> Buildings=Root->GetObjectField(TEXT("buildings"));
 if (!Res.IsValid() || !Buildings.IsValid()) return false;
 if (!IsIntegerField(Res,TEXT("gold"),0,MaxResources,Out.Gold) ||
     !IsIntegerField(Res,TEXT("wood"),0,MaxResources,Out.Wood) ||
     !IsIntegerField(Res,TEXT("stone"),0,MaxResources,Out.Stone) ||
     !IsIntegerField(Res,TEXT("aether"),0,MaxResources,Out.StarEssence)) return false;
 const bool bConstructionActive=Root->HasTypedField<EJson::Object>(TEXT("construction"));
 if (!bConstructionActive && !Root->HasTypedField<EJson::Null>(TEXT("construction")))
  return false;
 if (bConstructionActive)
 {
  const TSharedPtr<FJsonObject> Construction=Root->GetObjectField(TEXT("construction"));
  FString Building;
  int64 FromLevel=0, StartedAt=0, EndsAt=0;
  if (!Construction.IsValid() || !Construction->TryGetStringField(TEXT("id"),Building) ||
      !IsBuildingId(Building) ||
      !IsIntegerField(Construction,TEXT("fromLevel"),1,20,FromLevel) ||
      !IsIntegerField(Construction,TEXT("startedAt"),0,9007199254740991LL,StartedAt) ||
      !IsIntegerField(Construction,TEXT("endsAt"),0,9007199254740991LL,EndsAt) ||
      EndsAt<=StartedAt) return false;
  int64 CurrentLevel=0;
  if (!IsIntegerField(Buildings,*Building,1,20,CurrentLevel) ||
      CurrentLevel!=FromLevel) return false;
 }
 if (Root->HasTypedField<EJson::String>(TEXT("tradeDay")))
 {
  FString Date;
  if (!Root->TryGetStringField(TEXT("tradeDay"),Date) || !IsDateOnly(Date))
   return false;
 }
 if (Root->HasField(TEXT("tradeDay")) &&
     !Root->HasTypedField<EJson::String>(TEXT("tradeDay")) &&
     !Root->HasTypedField<EJson::Null>(TEXT("tradeDay"))) return false;
 if (Root->HasField(TEXT("tradeRoutes")))
 {
  if (!Root->HasTypedField<EJson::Array>(TEXT("tradeRoutes"))) return false;
  const TArray<TSharedPtr<FJsonValue>>& Routes=Root->GetArrayField(TEXT("tradeRoutes"));
  if (Routes.Num()>2) return false;
  TSet<FString> UniqueRoutes;
  for (const TSharedPtr<FJsonValue>& RouteValue:Routes)
  {
   FString Route;
   if (!RouteValue.IsValid() || !RouteValue->TryGetString(Route) ||
       (Route!=TEXT("wood") && Route!=TEXT("stone") && Route!=TEXT("aether")) ||
       UniqueRoutes.Contains(Route)) return false;
   UniqueRoutes.Add(Route);
  }
 }
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
     !Root->HasTypedField<EJson::Array>(TEXT("team")) ||
     !Root->HasTypedField<EJson::Array>(TEXT("cleared")) ||
     !Root->HasTypedField<EJson::Object>(TEXT("campaignStars")) ||
     !Root->HasField(TEXT("mission")) || !Root->HasField(TEXT("lastReport")))
  return false;
 const TSharedPtr<FJsonObject> Heroes=Root->GetObjectField(TEXT("heroes"));
 if (!Heroes.IsValid() || Heroes->Values.Num()>UE_ARRAY_COUNT(HeroIds)) return false;
 TSet<FString> Known;
 for (const TCHAR* HeroId:HeroIds) Known.Add(FString(HeroId));
 for (const auto& Field:Heroes->Values)
 {
  int64 Level=0;
  if (!Known.Contains(Field.Key) || !IsIntegerField(Heroes,*Field.Key,1,20,Level))
   return false;
  Out.HeroLevels.Add(Field.Key,static_cast<int32>(Level));
 }
 const TArray<TSharedPtr<FJsonValue>>& Team=Root->GetArrayField(TEXT("team"));
 if (Team.Num()!=3) return false;
 TSet<FString> UniqueTeam;
 for (const TSharedPtr<FJsonValue>& Entry:Team)
 {
  FString Id;
  if (!Entry.IsValid() || !Entry->TryGetString(Id) ||
      !Out.HeroLevels.Contains(Id) || UniqueTeam.Contains(Id)) return false;
  UniqueTeam.Add(Id);
  Out.Team.Add(Id);
 }
 const TArray<TSharedPtr<FJsonValue>>& Cleared=Root->GetArrayField(TEXT("cleared"));
 if (Cleared.Num()>8) return false;
 for (int32 I=0;I<Cleared.Num();++I)
 {
  double Stage=0;
  if (!Cleared[I].IsValid() || !Cleared[I]->TryGetNumber(Stage) ||
      Stage!=I+1) return false;
  Out.ClearedStages.Add(I+1);
 }
 const TSharedPtr<FJsonObject> Stars=Root->GetObjectField(TEXT("campaignStars"));
 if (!Stars.IsValid() || Stars->Values.Num()>8) return false;
 for (const auto& Entry:Stars->Values)
 {
  int32 Stage=0;
  int64 Rating=0;
  if (!FDefaultValueHelper::ParseInt(Entry.Key,Stage) ||
      !Out.ClearedStages.Contains(Stage) ||
      !IsIntegerField(Stars,*Entry.Key,1,3,Rating)) return false;
  Out.StoryStars.Add(Stage,static_cast<int32>(Rating));
 }

 if (Root->HasTypedField<EJson::Object>(TEXT("mission")))
 {
  const TSharedPtr<FJsonObject> Mission=Root->GetObjectField(TEXT("mission"));
  int64 Turn=0,Stage=0,PlayerHP=0,EnemyHP=0,PlayerMax=0,EnemyMax=0;
  int64 StartedAt=0,LastTurnAt=0;
  FString Mode;
  if (!Mission.IsValid() ||
      !Mission->TryGetStringField(TEXT("mode"),Mode) ||
      (Mode!=TEXT("story") && Mode!=TEXT("act2") && Mode!=TEXT("veteran") && Mode!=TEXT("rift") && Mode!=TEXT("maze") && Mode!=TEXT("boss")) ||
      !IsIntegerField(Mission,TEXT("stage"),1,8,Stage) ||
      !IsIntegerField(Mission,TEXT("turn"),0,36,Turn) ||
      !IsIntegerField(Mission,TEXT("playerHp"),0,100000,PlayerHP) ||
      !IsIntegerField(Mission,TEXT("enemyHp"),0,100000,EnemyHP) ||
      !IsIntegerField(Mission,TEXT("playerMaxHp"),1,100000,PlayerMax) ||
      !IsIntegerField(Mission,TEXT("enemyMaxHp"),1,100000,EnemyMax) ||
      !IsIntegerField(Mission,TEXT("startedAt"),1000000000000LL,20000000000000LL,StartedAt) ||
      !IsIntegerField(Mission,TEXT("lastTurnAt"),1000000000000LL,20000000000000LL,LastTurnAt) ||
      PlayerHP>PlayerMax || EnemyHP>EnemyMax || LastTurnAt<StartedAt)
   return false;
  Out.bInMission=true;
  Out.MissionMode=Mode;
  Out.MissionStage=static_cast<int32>(Stage);
  Out.MissionTurn=static_cast<int32>(Turn);
  Out.PlayerHP=PlayerHP; Out.EnemyHP=EnemyHP;
  Out.PlayerMaxHP=PlayerMax; Out.EnemyMaxHP=EnemyMax;
  Out.MissionStartedAt=StartedAt;
  Out.MissionLastTurnAt=LastTurnAt;
  Out.MissionId=FString::Printf(TEXT("%s:%d:%lld"),
   *Mode,static_cast<int32>(Stage),static_cast<long long>(StartedAt));

  // v2.55 server-owned combat metadata. Old single-wave saved missions
  // may omit these fields; new three-wave encounters must supply them together.
  const bool bWaveFields=Mission->HasField(TEXT("wave")) ||
   Mission->HasField(TEXT("waves")) || Mission->HasField(TEXT("waveTurn"));
  if (bWaveFields)
  {
   int64 Wave=0,Waves=0,WaveTurn=0;
   if (!IsIntegerField(Mission,TEXT("wave"),1,3,Wave) ||
       !IsIntegerField(Mission,TEXT("waves"),1,3,Waves) ||
       !IsIntegerField(Mission,TEXT("waveTurn"),0,36,WaveTurn) ||
       (Waves!=1 && Waves!=3) || Wave>Waves ||
       WaveTurn>Turn || (WaveTurn==0 && Turn==0 && Wave!=1) ||
       (Waves==3 && Mode!=TEXT("story") && Mode!=TEXT("act2")))
    return false;
   Out.MissionWave=static_cast<int32>(Wave);
   Out.MissionWaves=static_cast<int32>(Waves);
   Out.MissionWaveTurn=static_cast<int32>(WaveTurn);
  }
  FString Intent;
  if (Mission->HasField(TEXT("enemyIntent")))
  {
   if (!Mission->TryGetStringField(TEXT("enemyIntent"),Intent) ||
       (Intent!=TEXT("strike") && Intent!=TEXT("crush") &&
        Intent!=TEXT("shield") && Intent!=TEXT("drain") &&
        Intent!=TEXT("sunder") && Intent!=TEXT("eclipse")))
    return false;
  }
  Out.EnemyIntent=Intent;
  if (Mission->HasField(TEXT("lastAction")))
  {
   FString LastAction;
   if (!Mission->TryGetStringField(TEXT("lastAction"),LastAction) ||
       LastAction.Len()>96) return false;
   Out.LastAction=LastAction;
  }
  if (Mission->HasField(TEXT("lastRallyTurn")))
  {
   int64 Rally=0;
   if (!IsIntegerField(Mission,TEXT("lastRallyTurn"),0,36,Rally) ||
       Rally>Turn) return false;
   Out.LastRallyTurn=static_cast<int32>(Rally);
  }
  if (Mission->HasField(TEXT("cooldowns")))
  {
   if (!Mission->HasTypedField<EJson::Object>(TEXT("cooldowns"))) return false;
   const TSharedPtr<FJsonObject> Cooldowns=Mission->GetObjectField(TEXT("cooldowns"));
   if (!Cooldowns.IsValid() || Cooldowns->Values.Num()>3) return false;
   for (const auto& Entry:Cooldowns->Values)
   {
    int64 ReadyTurn=0;
    if (!Out.Team.Contains(Entry.Key) ||
        !IsIntegerField(Cooldowns,*Entry.Key,1,40,ReadyTurn) ||
        ReadyTurn>Turn+4) return false;
    Out.SkillCooldownTurns.Add(Entry.Key,static_cast<int32>(ReadyTurn));
   }
  }
 }
 else if (!Root->HasTypedField<EJson::Null>(TEXT("mission"))) return false;

 if (Root->HasTypedField<EJson::Object>(TEXT("lastReport")))
 {
  const TSharedPtr<FJsonObject> Report=Root->GetObjectField(TEXT("lastReport"));
  int64 Stage=0,StarsEarned=0;
  bool Won=false;
  bool bAbandoned=false;
  if (!Report.IsValid() || !Report->TryGetBoolField(TEXT("won"),Won))
   return false;
  Report->TryGetBoolField(TEXT("abandoned"),bAbandoned);
  // The production RPC intentionally returns {won:false,abandoned:true,at}
  // without stage/stars on retreat. Do not discard the entire account.
  if (bAbandoned)
  {
   if (Won) return false;
  }
  else
  {
   if (!IsIntegerField(Report,TEXT("stage"),1,8,Stage) ||
       !IsIntegerField(Report,TEXT("stars"),0,3,StarsEarned) ||
       (Won && StarsEarned==0) || (!Won && StarsEarned!=0))
    return false;
   Out.bHasResult=true; Out.bWon=Won;
   Out.ResultStage=static_cast<int32>(Stage);
   Out.ResultStars=static_cast<int32>(StarsEarned);
  }
 }
 else if (!Root->HasTypedField<EJson::Null>(TEXT("lastReport"))) return false;

 // Only an authenticated progress projection can populate the bag.
 // The real existing RPC returns inventory/loadouts/itemUpgrades/res/buildings.
 // Old versions lacking these fields still work, but their Bag stays locked.
 const bool bBagPresent=Root->HasField(TEXT("inventory")) ||
  Root->HasField(TEXT("loadouts")) || Root->HasField(TEXT("itemUpgrades"));
 if(bBagPresent)
 {
  if(!Root->HasTypedField<EJson::Object>(TEXT("inventory")) ||
     !Root->HasTypedField<EJson::Object>(TEXT("loadouts")) ||
     !Root->HasTypedField<EJson::Object>(TEXT("itemUpgrades")) ||
     !Root->HasTypedField<EJson::Object>(TEXT("res")) ||
     !Root->HasTypedField<EJson::Object>(TEXT("buildings"))) return false;
  const TSharedPtr<FJsonObject> Inv=Root->GetObjectField(TEXT("inventory"));
  const TSharedPtr<FJsonObject> Wear=Root->GetObjectField(TEXT("loadouts"));
  const TSharedPtr<FJsonObject> Upgrades=Root->GetObjectField(TEXT("itemUpgrades"));
  const TSharedPtr<FJsonObject> Res=Root->GetObjectField(TEXT("res"));
  const TSharedPtr<FJsonObject> Buildings=Root->GetObjectField(TEXT("buildings"));
  if(!Inv.IsValid() || !Wear.IsValid() || !Upgrades.IsValid() ||
     !Res.IsValid() || !Buildings.IsValid() ||
     Inv->Values.Num()>FStarfortBagCatalog::All().Num() ||
     Wear->Values.Num()>UE_ARRAY_COUNT(HeroIds) ||
     Upgrades->Values.Num()>FStarfortBagCatalog::All().Num()) return false;
  int64 G=0,W=0,S=0,E=0,Forge=0;
  if(!IsIntegerField(Res,TEXT("gold"),0,MaxResources,G) ||
     !IsIntegerField(Res,TEXT("wood"),0,MaxResources,W) ||
     !IsIntegerField(Res,TEXT("stone"),0,MaxResources,S) ||
     !IsIntegerField(Res,TEXT("aether"),0,MaxResources,E) ||
     !IsIntegerField(Buildings,TEXT("forge"),0,30,Forge)) return false;
  Out.Gold=G;Out.Wood=W;Out.Stone=S;Out.StarEssence=E;
  Out.ForgeLevel=static_cast<int32>(Forge);
  for(const auto& Pair:Inv->Values)
  {
   int64 Count=0;
   if(!FStarfortBagCatalog::Find(Pair.Key) ||
      !IsIntegerField(Inv,*Pair.Key,1,20,Count)) return false;
   Out.Inventory.Add(Pair.Key,static_cast<int32>(Count));
  }
  for(const auto& Pair:Upgrades->Values)
  {
   int64 Level=0;
   if(!FStarfortBagCatalog::Find(Pair.Key) ||
      !IsIntegerField(Upgrades,*Pair.Key,0,5,Level)) return false;
   Out.ItemUpgrades.Add(Pair.Key,static_cast<int32>(Level));
  }
  TMap<FString,int32> InUse;
  for(const auto& HeroPair:Wear->Values)
  {
   if(!Out.HeroLevels.Contains(HeroPair.Key) ||
      !HeroPair.Value.IsValid() ||
      HeroPair.Value->Type!=EJson::Object) return false;
   const TSharedPtr<FJsonObject> Slots=HeroPair.Value->AsObject();
   if(!Slots.IsValid() || Slots->Values.Num()>3) return false;
   FStarfortBagLoadout Set;
   for(const auto& SlotPair:Slots->Values)
   {
    FString ItemId;
    if(!FStarfortBagCatalog::IsSlot(SlotPair.Key) ||
       !SlotPair.Value.IsValid() ||
       !SlotPair.Value->TryGetString(ItemId)) return false;
    const FStarfortBagItemInfo* Entry=FStarfortBagCatalog::Find(ItemId);
    if(!Entry || SlotPair.Key!=Entry->Slot ||
       !Out.Inventory.Contains(ItemId)) return false;
    if(SlotPair.Key==TEXT("weapon"))Set.Weapon=ItemId;
    else if(SlotPair.Key==TEXT("armor"))Set.Armor=ItemId;
    else Set.Relic=ItemId;
    const int32 NewCount=InUse.FindRef(ItemId)+1;
    if(NewCount>Out.Inventory.FindRef(ItemId)) return false;
    InUse.Add(ItemId,NewCount);
   }
   Out.Loadouts.Add(HeroPair.Key,Set);
  }
  Out.bInventoryVerified=true;
  // The current official RPC returns these real late-game fields.
  // Optional for old backends; never fabricate rank or weekly boss wins.
  if(Root->HasField(TEXT("relicAscensions")) ||
     Root->HasField(TEXT("bossSeals")))
  {
   if(!Root->HasTypedField<EJson::Object>(TEXT("relicAscensions")))
    return false;
   const TSharedPtr<FJsonObject> Asc=Root->GetObjectField(TEXT("relicAscensions"));
   int64 BossWeeks=0;
   if(!Asc.IsValid() || Asc->Values.Num()>4 ||
      !IsIntegerField(Root,TEXT("bossSeals"),0,5000,BossWeeks))
    return false;
   for(const auto& Pair:Asc->Values)
   {
    int64 Rank=0;
    if((Pair.Key!=TEXT("ember_guard") &&
        Pair.Key!=TEXT("star_spear") &&
        Pair.Key!=TEXT("guardian_seal") &&
        Pair.Key!=TEXT("starbreaker")) ||
       !IsIntegerField(Asc,*Pair.Key,0,4,Rank) ||
       !Out.Inventory.Contains(Pair.Key) ||
       Out.ItemUpgrades.FindRef(Pair.Key)<5) return false;
    Out.RelicAscensions.Add(Pair.Key,static_cast<int32>(Rank));
   }
   Out.BossSeals=static_cast<int32>(BossWeeks);
   Out.bAscensionVerified=true;
  }
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
     // An unknown POST outcome must NOT be retried with a new mutation ID.
     // A read-only GET reconciles the actual server-owned balances and level.
     WeakThis->Fail(TEXT("Geliştirme yanıtı doğrulanamadı. Köy yeniden okunuyor."));
     WeakThis->LoadVillage();
     return;
    }
    WeakThis->OnVillageReady.Broadcast(Snapshot);
   });
 });
}
void UStarfortOnlineSubsystem::LoadProgress()
{
 SubmitProgressAction(TEXT("get"),TEXT(""),TEXT(""));
}
bool UStarfortOnlineSubsystem::IsAllowedHero(const FString& Id)
{
 for (const TCHAR* HeroId : StarfortOnline::HeroIds)
  if (Id==HeroId) return true;
 return false;
}
bool UStarfortOnlineSubsystem::IsAllowedBattleAction(const FString& Action)
{
 if (Action==TEXT("strike") || Action==TEXT("guard") ||
     Action==TEXT("feint") || Action==TEXT("rally")) return true;
 if (!Action.StartsWith(TEXT("skill:"))) return false;
 return IsAllowedHero(Action.RightChop(6));
}
void UStarfortOnlineSubsystem::StartStoryStage(int32 Stage)
{
 if (Stage<1 || Stage>8)
 {
  Fail(TEXT("Geçersiz hikâye bölümü."));
  return;
 }
 SubmitProgressAction(TEXT("mission_start"),FString::FromInt(Stage),TEXT(""));
}
void UStarfortOnlineSubsystem::SubmitBattleAction(const FString& ActionId)
{
 if (!IsAllowedBattleAction(ActionId))
 {
  Fail(TEXT("Savaş hamlesi geçersiz."));
  return;
 }
 SubmitProgressAction(TEXT("mission_turn"),TEXT(""),ActionId);
}
void UStarfortOnlineSubsystem::AbandonMission()
{
 SubmitProgressAction(TEXT("mission_abandon"),TEXT(""),TEXT(""));
}
void UStarfortOnlineSubsystem::TrainHero(const FString& HeroId)
{
 if (!IsAllowedHero(HeroId))
 {
  Fail(TEXT("Kahraman kimliği geçersiz."));
  return;
 }
 SubmitProgressAction(TEXT("hero"),HeroId,TEXT(""));
}
void UStarfortOnlineSubsystem::EquipGear(
 const FString& HeroId,const FString& ItemId)
{
 if(!IsSignedIn() || !IsAllowedHero(HeroId) ||
    !FStarfortBagCatalog::Find(ItemId)) return;
 SubmitProgressAction(TEXT("equip"),HeroId,ItemId);
}
void UStarfortOnlineSubsystem::UnequipGear(
 const FString& HeroId,const FString& Slot)
{
 if(!IsSignedIn() || !IsAllowedHero(HeroId) ||
    !FStarfortBagCatalog::IsSlot(Slot)) return;
 SubmitProgressAction(TEXT("unequip"),HeroId,Slot);
}
void UStarfortOnlineSubsystem::ForgeGear(const FString& ItemId)
{
 const FStarfortBagItemInfo* Info=FStarfortBagCatalog::Find(ItemId);
 if(!IsSignedIn() || !Info || Info->ForgeLevel<=0) return;
 SubmitProgressAction(TEXT("forge"),ItemId,TEXT(""));
}
void UStarfortOnlineSubsystem::EnhanceGear(const FString& ItemId)
{
 if(!IsSignedIn() || !FStarfortBagCatalog::Find(ItemId)) return;
 SubmitProgressAction(TEXT("enhance"),ItemId,TEXT(""));
}
void UStarfortOnlineSubsystem::AscendGear(const FString& ItemId)
{
 if(!IsSignedIn() ||
    (ItemId!=TEXT("ember_guard") &&
     ItemId!=TEXT("star_spear") &&
     ItemId!=TEXT("guardian_seal") &&
     ItemId!=TEXT("starbreaker"))) return;
 SubmitProgressAction(TEXT("ascend"),ItemId,TEXT(""));
}
void UStarfortOnlineSubsystem::SubmitProgressAction(const FString& Action,
 const FString& Target,const FString& Aux)
{
 if (bProgressPending)
 {
  // A silent rejection leaves the UMG command in permanent 'pending' state.
  // Emit a safe error; never queue or replay an economic mutation.
  Fail(TEXT("Önceki hesap işlemi devam ediyor. Son durum geldikten sonra tekrar dene."));
  return;
 }
 if (Action!=TEXT("get") && Action!=TEXT("mission_start") &&
     Action!=TEXT("mission_turn") && Action!=TEXT("mission_abandon") &&
     Action!=TEXT("hero") && Action!=TEXT("equip") &&
     Action!=TEXT("unequip") && Action!=TEXT("forge") &&
     Action!=TEXT("enhance") && Action!=TEXT("ascend")) return;
 bProgressPending=true;
 const TWeakObjectPtr<UStarfortOnlineSubsystem> WeakThis(this);
 WithFreshSession([WeakThis,Action,Target,Aux](bool Ready)
 {
  if (!WeakThis.IsValid()) return;
  if (!Ready)
  {
   WeakThis->bProgressPending=false;
   WeakThis->Fail(TEXT("Hesap işlemi için tekrar giriş yap."));
   return;
  }
  const TSharedPtr<FJsonObject> Body=MakeShared<FJsonObject>();
  Body->SetStringField(TEXT("p_action"),Action);
  if (Target.IsEmpty()) Body->SetField(TEXT("p_target"),MakeShared<FJsonValueNull>());
  else Body->SetStringField(TEXT("p_target"),Target);
  if (Aux.IsEmpty()) Body->SetField(TEXT("p_aux"),MakeShared<FJsonValueNull>());
  else Body->SetStringField(TEXT("p_aux"),Aux);
  // An unknown network outcome must not cause an automatic retry of a mutation.
  if (Action==TEXT("get"))
   Body->SetField(TEXT("p_request_id"),MakeShared<FJsonValueNull>());
  else
   Body->SetStringField(TEXT("p_request_id"),
    FGuid::NewGuid().ToString(EGuidFormats::DigitsWithHyphens));
  WeakThis->RequestJson(TEXT("/rest/v1/rpc/sfb_starfort_progress"),
   TEXT("POST"),StarfortOnline::ToJson(Body),WeakThis->AccessToken,
   [WeakThis,Action](bool Ok,const TSharedPtr<FJsonObject>& Root)
   {
    if (!WeakThis.IsValid()) return;
    WeakThis->bProgressPending=false;
    WeakThis->AcceptProgressPayload(Ok,Root,Action);
   });
 });
}
void UStarfortOnlineSubsystem::AcceptProgressPayload(
 bool bOk,const TSharedPtr<FJsonObject>& Root,const FString& Action)
{
 FStarfortProgressSummary Snapshot;
 if (!bOk || !ParseProgress(Root,Snapshot))
 {
  bLastProgressValid=false;
  LastMissionId.Empty();
  LastMissionTurn=-1;
  LastEnemyHP=0;
  LastPlayerHP=0;
  Fail(TEXT("İlerleme sunucusu yanıtı doğrulanamadı. Durum yeniden okunuyor."));
  // GET only. NEVER repeat a mutation with a different idempotency key.
  if (Action!=TEXT("get")) LoadProgress();
  return;
 }
 int64 Damage=0;
 int64 DamageReceived=0;
 const bool bContinuing=bLastProgressValid && Snapshot.bInMission &&
  LastMissionId==Snapshot.MissionId && Snapshot.MissionTurn>LastMissionTurn;
 if (bContinuing)
 {
  Damage=FMath::Max<int64>(0,LastEnemyHP-Snapshot.EnemyHP);
  DamageReceived=FMath::Max<int64>(0,LastPlayerHP-Snapshot.PlayerHP);
 }
 bLastProgressValid=true;
 if (Snapshot.bInMission)
 {
  LastMissionId=Snapshot.MissionId;
  LastMissionTurn=Snapshot.MissionTurn;
  LastEnemyHP=Snapshot.EnemyHP;
  LastPlayerHP=Snapshot.PlayerHP;
 }
 else
 {
  LastMissionId.Empty();
  LastMissionTurn=-1;
  LastEnemyHP=0;
  LastPlayerHP=0;
 }

 OnProgressReady.Broadcast(Snapshot);
 if (Snapshot.bInMission)
 {
  FStarfortVerifiedBattleTurn Battle;
  Battle.RoomId=Snapshot.MissionId;
  Battle.Turn=Snapshot.MissionTurn;
  Battle.HeroHP=Snapshot.PlayerHP;
  Battle.HeroMaxHP=Snapshot.PlayerMaxHP;
  Battle.EnemyHP=Snapshot.EnemyHP;
  Battle.EnemyMaxHP=Snapshot.EnemyMaxHP;
  Battle.VerifiedDamageDealt=Damage;
  Battle.VerifiedDamageReceived=DamageReceived;
  Battle.TeamHeroes=Snapshot.Team;
  Battle.SkillCooldownTurns=Snapshot.SkillCooldownTurns;
  Battle.EnemyIntent=Snapshot.EnemyIntent;
  Battle.LastAction=Snapshot.LastAction;
  Battle.Wave=Snapshot.MissionWave;
  Battle.Waves=Snapshot.MissionWaves;
  Battle.WaveTurn=Snapshot.MissionWaveTurn;
  Battle.LastRallyTurn=Snapshot.LastRallyTurn;
  Battle.LastTurnAtUnixMs=Snapshot.MissionLastTurnAt;
  Battle.bServerVerified=true;
  // The IDs below are VALID INPUT SHAPES, not promises of cooldown readiness.
  // Server checks every action again; its rejection is never shown as success.
  if (Battle.HeroHP>0 && Battle.EnemyHP>0)
  {
   Battle.ServerAllowedActions={TEXT("strike"),TEXT("guard"),TEXT("feint"),TEXT("rally")};
   for (const FString& HeroId:Snapshot.Team)
    Battle.ServerAllowedActions.Add(TEXT("skill:")+HeroId);
  }
  OnBattleReady.Broadcast(Battle);
 }
 else if (Action==TEXT("mission_turn") && Snapshot.bHasResult)
  OnMissionResult.Broadcast(Snapshot.bWon,Snapshot.ResultStars);
}
