"""Unreal Editor > Tools > Execute Python Script.

Install user-owned genuine free Paragon rigs into the REAL signed-in native
STARFORT battle map for a Development-only cinematic art review.
Before running, back up your local L_StarfortBattle.umap.
"""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from stage_verified_fab_online_battle_v84 import main
result=main(["--stage"])
if result:
    import unreal
    unreal.log_error("STARFORT live 3D art preview not staged. Check real Epic/Fab rigs and local EULA.")
