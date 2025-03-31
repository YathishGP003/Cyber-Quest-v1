import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/ai-card";
import { Activity, Award, Calendar, CheckCircle2 } from "lucide-react";

const StatsCards = ({ assessments }) => {
  // Calculate stats based on assessments
  const totalAssessments = assessments?.length || 0;
  const completedAssessments = totalAssessments; // All assessments are considered completed
  const averageScore = assessments?.length > 0
    ? Math.round(
        assessments.reduce((sum, a) => sum + (a.score || 0), 0) / assessments.length
      )
    : 0;
  
  const lastAssessmentDate = assessments?.length > 0
    ? new Date(assessments[0].updatedAt).toLocaleDateString()
    : "No assessments yet";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAssessments}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedAssessments}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageScore}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Assessment</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lastAssessmentDate}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
