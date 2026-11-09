"""Unreal Editor: Tools > Execute Python Script; create only private preview .umaps."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fab_seven_private_preview_v80 import main
result=main(["--stage"])
if result:
    import unreal
    unreal.log_error("STARFORT: Private preview could not be built. Review Saved/QA/ selections and Fab EULA.")
