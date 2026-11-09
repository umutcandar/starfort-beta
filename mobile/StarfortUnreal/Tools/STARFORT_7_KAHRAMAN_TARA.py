"""Unreal Editor: Tools > Execute Python Script; real licensed Fab asset scan."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fab_seven_private_preview_v80 import main
result=main(["--scan"])
if result:
    import unreal
    unreal.log_warning("STARFORT: missing some real Fab packs. See Saved/QA/fab_seven_private_scan_v80.json")
