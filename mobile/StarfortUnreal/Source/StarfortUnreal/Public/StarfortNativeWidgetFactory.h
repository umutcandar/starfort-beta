#pragma once

#include "CoreMinimal.h"

class UStarfortLoginScreen;
class UStarfortVillageScreen;
class UStarfortCampaignScreen;
class UStarfortBattleScreen;
class UStarfortHeroScreen;

/**
 * Native UMG bootstrap UI for iOS/Android builds before art-authored widget
 * blueprints are cooked. All components are real UMG widgets with touch input,
 * not HTML/WebView or a fake game screenshot.
 *
 * This is a FUNCTIONAL QA FALLBACK, not the approved final cinematic artwork.
 * User-authored Widget Blueprints take precedence: if a widget tree already
 * exists, the factory must never overwrite it.
 */
class STARFORTUNREAL_API FStarfortNativeWidgetFactory
{
public:
 static bool BuildLogin(UStarfortLoginScreen* Screen);
 static bool BuildVillage(UStarfortVillageScreen* Screen);
 static bool BuildCampaign(UStarfortCampaignScreen* Screen);
 static bool BuildBattle(UStarfortBattleScreen* Screen);
 static bool BuildHero(UStarfortHeroScreen* Screen);
};
