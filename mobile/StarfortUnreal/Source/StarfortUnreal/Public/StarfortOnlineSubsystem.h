#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "StarfortVillageScreen.h"
#include "StarfortBattleScreen.h"
#include "StarfortOnlineSubsystem.generated.h"

/** A minimal read-only account projection of sfb_starfort_progress.
 * The backend does not provide all hero stats in that RPC, so NO invented
 * attack/defense or equipment scores are filled in here.
 */
USTRUCT(BlueprintType)
struct FStarfortProgressSummary
{
 GENERATED_BODY()
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") TMap<FString,int32> HeroLevels;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") TArray<FString> Team;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") TArray<int32> ClearedStages;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") TMap<int32,int32> StoryStars;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") bool bInMission = false;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") FString MissionId;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") FString MissionMode;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 MissionStage = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 MissionStartedAt = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 MissionLastTurnAt = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 MissionTurn = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 MissionWave = 1;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 MissionWaves = 1;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 MissionWaveTurn = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 LastRallyTurn = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") FString EnemyIntent;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") FString LastAction;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") TMap<FString,int32> SkillCooldownTurns;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 PlayerHP = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 EnemyHP = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 PlayerMaxHP = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 EnemyMaxHP = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") bool bHasResult = false;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") bool bWon = false;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 ResultStage = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 ResultStars = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") bool bServerVerified = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortSignedIn, FString, UserId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortServiceFailure, FString, SafeReason);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortVillageSnapshotReady, const FStarfortVerifiedVillage&, Snapshot);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortProgressReady, const FStarfortProgressSummary&, Snapshot);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FStarfortSignedOut);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortBattleReady, const FStarfortVerifiedBattleTurn&, Snapshot);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FStarfortMissionResult, bool, bWon, int32, Stars);

/** Game-instance scoped native REST adapter to the SAME Supabase project used
 * by the legacy client. Never persists tokens, never logs credentials, never
 * sends any service-role key, never awards resources on the phone.
 *
 * Email/password is first-pass only; secure OS-native token persistence,
 * Google/Apple callbacks, and in-editor/device QA remain release gates.
 */
UCLASS()
class STARFORTUNREAL_API UStarfortOnlineSubsystem : public UGameInstanceSubsystem
{
 GENERATED_BODY()
public:
 UFUNCTION(BlueprintCallable, Category="STARFORT|Online")
 void SignIn(const FString& Email, const FString& Password);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Online")
 void SignOut();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Online")
 void LoadVillage();
 UFUNCTION(BlueprintCallable, Category="STARFORT|Online")
 void RequestVillageUpgrade(FName BuildingId);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Online")
 void LoadProgress();
 /** Real server mission start: 1..8; progression and resource costs remain server-owned. */
 UFUNCTION(BlueprintCallable, Category="STARFORT|Battle") void StartStoryStage(int32 Stage);
 /** Strictly allowlisted server combat commands. Never submit HP or damage. */
 UFUNCTION(BlueprintCallable, Category="STARFORT|Battle") void SubmitBattleAction(const FString& ActionId);
 UFUNCTION(BlueprintCallable, Category="STARFORT|Battle") void AbandonMission();
 /** Uses existing account server's hero upgrade action. */
 UFUNCTION(BlueprintCallable, Category="STARFORT|Heroes") void TrainHero(const FString& HeroId);
 UFUNCTION(BlueprintPure, Category="STARFORT|Online")
 bool IsSignedIn() const { return !AccessToken.IsEmpty() && !UserId.IsEmpty(); }
 UFUNCTION(BlueprintPure, Category="STARFORT|Online")
 FString GetUserId() const { return UserId; }

 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortSignedIn OnSignedIn;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortSignedOut OnSignedOut;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortServiceFailure OnFailure;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortVillageSnapshotReady OnVillageReady;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortProgressReady OnProgressReady;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortBattleReady OnBattleReady;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortMissionResult OnMissionResult;

 virtual void Deinitialize() override;

private:
 FString AccessToken;
 FString RefreshToken;
 FString UserId;
 int64 ExpiresAtUnix = 0;
 uint64 SessionGeneration = 0;
 bool bSignInPending = false;
 bool bRefreshPending = false;
 bool bVillagePending = false;
 bool bProgressPending = false;
 bool bLastProgressValid = false;
 FString LastMissionId;
 int32 LastMissionTurn = -1;
 int64 LastEnemyHP = 0;
 TArray<TFunction<void(bool)>> RefreshWaiters;

 void WithFreshSession(TFunction<void(bool)> OnReady);
 void FinishRefresh(bool bSuccess);
 void RequestJson(const FString& Path, const FString& Verb, const FString& JsonBody,
  const FString& Bearer, TFunction<void(bool, const TSharedPtr<class FJsonObject>&)> OnDone);
 bool ValidateConfig() const;
 void Fail(const TCHAR* SafeMessage);
 static bool ParseVillage(const TSharedPtr<class FJsonObject>& Root,
  const FString& AuthenticatedUserId, FStarfortVerifiedVillage& Out);
 static bool ParseProgress(const TSharedPtr<class FJsonObject>& Root, FStarfortProgressSummary& Out);
 void SubmitProgressAction(const FString& Action, const FString& Target,
  const FString& Aux);
 void AcceptProgressPayload(bool bOk, const TSharedPtr<class FJsonObject>& Root,
  const FString& Action);
 static bool IsAllowedBattleAction(const FString& ActionId);
 static bool IsAllowedHero(const FString& HeroId);
};
