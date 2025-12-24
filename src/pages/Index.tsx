import { useState } from "react";
import { Sidebar } from "@/components/cdn/Sidebar";
import { FileBrowser } from "@/components/cdn/FileBrowser";
import { ApiKeys } from "@/components/cdn/ApiKeys";
import { Endpoints } from "@/components/cdn/Endpoints";
import { Analytics } from "@/components/cdn/Analytics";
import { Settings } from "@/components/cdn/Settings";

const Index = () => {
  const [activeTab, setActiveTab] = useState("files");

  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return <FileBrowser />;
      case "api-keys":
        return <ApiKeys />;
      case "endpoints":
        return <Endpoints />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      default:
        return <FileBrowser />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
