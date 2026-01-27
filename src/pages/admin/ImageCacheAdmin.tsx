import React from "react";
import ImageCacheMonitor from "@/components/admin/ImageCacheMonitor";

const ImageCacheAdmin: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Image Cache</h1>
        <p className="text-sm text-muted-foreground">
          Monitor and manage the image cache refresh system. Images older than
          24 hours are automatically refreshed daily.
        </p>
      </div>
      <ImageCacheMonitor />
    </div>
  );
};

export default ImageCacheAdmin;
