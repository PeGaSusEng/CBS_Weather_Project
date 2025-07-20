import TimeSeries_lag30 from "./TimeSeries";
import PieAwan24Jam from "./Pie_chart";

export default function FungsiPlot() {
  return (
    <div className="
      fixed bottom-0 left-4 sm:left-8 w-full sm:w-auto flex flex-col gap-4
      justify-start items-start p-4 z-20 mt-16
    ">
      <div className="w-full flex items-center justify-start mb-4">
        <div className="
          bg-gray-900/90 rounded-xl flex items-center justify-center
          p-2 sm:p-3 md:p-4
          w-full max-w-[90%] sm:max-w-[450px] md:max-w-[500px]  
          h-[250px] xs:h-[180px] sm:h-[200px] md:h-[220px]  
          overflow-hidden
        ">
          <PieAwan24Jam />
        </div>
      </div>

 
      <div className="w-full flex items-center justify-start mb-12">
        <div className="
          bg-gray-900/90 rounded-xl flex items-center justify-center
          p-1 sm:p-3 md:p-2
          w-full max-w-[90%] sm:max-w-[750px] md:w-[800px] 
          h-[223px] sm:h-[230px] md:h-[270px]  
          overflow-hidden
        ">
          <TimeSeries_lag30 />
        </div>
      </div>
    </div>
  );
}
