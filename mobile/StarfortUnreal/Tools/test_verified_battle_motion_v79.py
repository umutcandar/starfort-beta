"""STARFORT v79 source regression tests; an Unreal Editor build is separate."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "Source/StarfortUnreal"


class ServerVerifiedCinematicTests(unittest.TestCase):
    def read(self, rel):
        return (BASE / rel).read_text(encoding="utf-8")

    def test_server_hp_loss_drives_counterattack_only(self):
        header = self.read("Public/StarfortOnlineSubsystem.h")
        source = self.read("Private/StarfortOnlineSubsystem.cpp")
        battle = self.read("Public/StarfortBattleScreen.h")
        self.assertIn("int64 LastPlayerHP = 0;", header)
        self.assertIn("int64 DamageReceived=0;", source)
        self.assertIn("LastPlayerHP-Snapshot.PlayerHP", source)
        self.assertIn("LastMissionId==Snapshot.MissionId", source)
        self.assertIn("Snapshot.MissionTurn>LastMissionTurn", source)
        self.assertIn("Battle.VerifiedDamageReceived=DamageReceived;", source)
        self.assertIn("LastPlayerHP=0;", source)
        self.assertIn("VerifiedDamageReceived = 0;", battle)
        self.assertNotIn("Battle.VerifiedDamageReceived=FMath::Rand", source)

    def test_counterattack_plays_only_on_positive_authenticated_hp_delta(self):
        header = self.read("Public/StarfortBattleStage.h")
        stage = self.read("Private/StarfortBattleStage.cpp")
        for token in (
            "EnemyAttackFX", "EnemyAttackMontage", "EnemyAttackSystem",
            "EnemyAttackSound", "VerifiedCounterattackTimer",
            "PlayDelayedVerifiedCounterattack", "ResetVerifiedCombatMotion",
            "TickVerifiedCombatMotion", "BeginVerifiedCombatMotion",
            "CaptureAuthoredFormation",
        ):
            self.assertIn(token, header)
            self.assertIn(token, stage)
        for token in (
            "Snapshot.bServerVerified", "Snapshot.VerifiedDamageReceived>0",
            "ActiveRoomId!=PlaybackRoom", "LastConfirmedTurn!=PlaybackTurn",
            "PlaybackGeneration!=TeamLoadGeneration",
            "GetWorldTimerManager().ClearTimer(VerifiedCounterattackTimer)",
            "EnemyAnim->Montage_Play(EnemyAttackMontage)",
            "EnemyAttackFX->Activate(true)", "HeroFormation[I]+HeroMotionOffsets[I]*Wave",
            "FMath::Sin(PI*Phase)", "FVector(-122.f,0.f,0.f)",
        ):
            self.assertIn(token, stage)
        self.assertEqual(stage.count("{"), stage.count("}"))
        self.assertIn("EnemyAttackMontage==EnemyHitMontage", stage)
        self.assertIn("EnemyAttackSystem==ImpactSystem", stage)

    def test_hud_shows_only_verified_counterattack(self):
        hud = self.read("Private/StarfortBattleScreen.cpp")
        self.assertIn("NewTurn.VerifiedDamageReceived<0", hud)
        self.assertIn("NewTurn.VerifiedDamageReceived>NewTurn.HeroMaxHP", hud)
        self.assertIn('TEXT("Düşman karşı saldırısı:', hud)
        self.assertIn("NewTurn.VerifiedDamageReceived>0", hud)
        self.assertNotIn("NewTurn.HeroHP-=", hud)

    def test_editor_automation_defaults_are_server_only(self):
        tests = self.read("Private/Tests/StarfortNativeAutomationTests.cpp")
        self.assertIn("Turn.VerifiedDamageReceived", tests)
        self.assertIn('TestEqual(TEXT("No fabricated received damage"),Turn.VerifiedDamageReceived', tests)
        self.assertIn("Enemy attack Niagara component", tests)


if __name__ == "__main__":
    unittest.main()
