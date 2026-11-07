using UnrealBuildTool;
public class StarfortUnrealTarget : TargetRules
{
    public StarfortUnrealTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Game;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("StarfortUnreal");
    }
}
