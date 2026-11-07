#pragma once
#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "StarfortOnlineSettings.generated.h"

/** Publishable Supabase settings only. Never place a service-role key here.
 * Session tokens are kept only in volatile UStarfortOnlineSubsystem memory.
 */
UCLASS(Config=Game, DefaultConfig)
class STARFORTUNREAL_API UStarfortOnlineSettings : public UObject
{
 GENERATED_BODY()
public:
 UPROPERTY(Config, EditDefaultsOnly, Category="STARFORT|Network")
 FString SupabaseUrl;
 UPROPERTY(Config, EditDefaultsOnly, Category="STARFORT|Network")
 FString PublishableKey;
};
