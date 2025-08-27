
import json, sys
from .schemas import LawFinderInput
from .agent import LawFinderAgent
def main():
    feature=sys.argv[1] if len(sys.argv)>1 else "Test feature"
    regions=["Utah"]
    if len(sys.argv)>2:
        regions=[r.strip() for r in sys.argv[2].split(",") if r.strip()]
    agent=LawFinderAgent(index_root="./indices")
    out=agent.run(LawFinderInput(feature_summary=feature,regions=regions,min_year=2023))
    print(json.dumps(out.model_dump(mode="json"),indent=2,ensure_ascii=False))
if __name__=="__main__": main()
