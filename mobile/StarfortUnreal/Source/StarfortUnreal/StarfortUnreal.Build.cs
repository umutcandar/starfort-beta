using UnrealBuildTool;
public class StarfortUnreal : ModuleRules {
 public StarfortUnreal(ReadOnlyTargetRules Target) : base(Target) {
  PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
  PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "Niagara" });
 }
}
