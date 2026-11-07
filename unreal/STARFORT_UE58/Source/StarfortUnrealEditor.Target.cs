using UnrealBuildTool;
public class StarfortUnrealEditorTarget : TargetRules
{
    public StarfortUnrealEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        ExtraModuleNames.Add("StarfortUnreal");
    }
}
