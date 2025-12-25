import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-border bg-card">
          <CardContent className="pt-8 pb-8 sm:pt-12 sm:pb-12 px-4 sm:px-6">
            <div className="text-center space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <h1 className="text-6xl sm:text-8xl font-bold text-foreground">404</h1>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Page Not Found</h2>
                <p className="text-muted-foreground">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>
              
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate(-1)} variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => navigate("/")} className="glow-primary w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Return Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
