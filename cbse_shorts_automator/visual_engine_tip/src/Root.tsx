import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useState } from "react";
import { secondsToFrames } from "./logic/timeConversion"; // Import helper
import { Main } from "./Main";
// UPDATE IMPORT: Use the new wrapper schema
import { ExamScenario, mainCompositionSchema } from "./schema"; 

export const RemotionRoot: React.FC = () => {
  const [handle] = useState(() => delayRender("Fetching Scenario Data"));
  const [scenarioData, setScenarioData] = useState<ExamScenario | null>(null);

  useEffect(() => {
    fetch(staticFile("scenario_data.json"))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load scenario data");
        return res.json();
      })
      .then((json) => {
        setScenarioData(json);
        continueRender(handle);
      })
      .catch((err) => {
        console.error("Critical Error loading data:", err);
        continueRender(handle); 
      });
  }, [handle]);

  if (!scenarioData) {
    return null;
  }
  const durationInFrames = Math.ceil(
    scenarioData.timings.total_duration * scenarioData.meta.config.fps
  );

  return (
    <Composition
      id="NCERT-Shorts-Tip"
      component={Main}
      durationInFrames={durationInFrames}
      fps={scenarioData.meta.config.fps}
      width={scenarioData.meta.config.resolution.w}
      height={scenarioData.meta.config.resolution.h}
      // UPDATE PROP: Use the wrapper schema that expects { data: ... }
      schema={mainCompositionSchema} 
      defaultProps={{
        data: scenarioData
      }}
    />
  );
};