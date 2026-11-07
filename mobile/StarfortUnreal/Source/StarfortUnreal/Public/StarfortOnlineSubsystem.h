#pragma once
#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "StarfortVillageScreen.h"
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
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") bool bInMission = false;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int32 MissionTurn = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 PlayerHP = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") int64 EnemyHP = 0;
 UPROPERTY(BlueprintReadOnly, Category="STARFORT|Account") bool bServerVerified = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortSignedIn, FString, UserId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortServiceFailure, FString, SafeReason);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortVillageSnapshotReady, const FStarfortVerifiedVillage&, Snapshot);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FStarfortProgressReady, const FStarfortProgressSummary&, Snapshot);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FStarfortSignedOut);

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
 UFUNCTION(BlueprintPure, Category="STARFORT|Online")
 bool IsSignedIn() const { return !AccessToken.IsEmpty() && !UserId.IsEmpty(); }
 UFUNCTION(BlueprintPure, Category="STARFORT|Online")
 FString GetUserId() const { return UserId; }

 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortSignedIn OnSignedIn;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortSignedOut OnSignedOut;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortServiceFailure OnFailure;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortVillageSnapshotReady OnVillageReady;
 UPROPERTY(BlueprintAssignable, Category="STARFORT|Online") FStarfortProgressReady OnProgressReady;

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
};
