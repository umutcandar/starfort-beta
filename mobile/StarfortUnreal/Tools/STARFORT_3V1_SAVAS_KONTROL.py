"""Unreal Editor > Tools > Execute Python Script; inspect REAL local 3v1 assets."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from verify_private_fab_battle_v82 import main
code=main(["--verify"])
if code:
    import unreal
    unreal.log_error("STARFORT private 3v1 visual QA NOT READY; check Saved/QA/Private3v1RealFabBattleAudit_v82.json")
