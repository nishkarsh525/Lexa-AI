import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

const severityClassName = {
  Low: "bg-green-500 text-white",
  Medium: "bg-yellow-500 text-black",
  High: "bg-red-500 text-white",
};

export default function ContractRiskDashboard() {
  const { contractId } = useParams();
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRiskData() {
      try {
        setLoading(true);
        const res = await api.get(`/contracts/${contractId}/risk-analysis`);
        setRiskData(res.data);
      } catch (err) {
        setError("Failed to load risk analysis");
      } finally {
        setLoading(false);
      }
    }

    fetchRiskData();
  }, [contractId]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!riskData) return null;

  const { overall_risk_level, risk_score, risks, risk_distribution, confidence, total_risks } = riskData;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Contract Risk Dashboard</h1>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Overall Risk Level</span>
            <Badge className={severityClassName[overall_risk_level] || "bg-gray-400"}>{overall_risk_level}</Badge>
          </div>
          <div className="space-y-2">
            <span className="font-semibold">Risk Score</span>
            <div className="flex items-center gap-3">
              <Progress value={risk_score} className="h-4 rounded" />
              <span>{risk_score}/100</span>
            </div>
          </div>
          <div>
            <span className="font-semibold">Confidence: </span>
            {(confidence * 100).toFixed(0)}%
          </div>
          <div>
            <span className="font-semibold">Total Risks Identified: </span>
            {total_risks}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <h2 className="font-semibold text-lg">Risk Distribution by Type</h2>
          {Object.entries(risk_distribution).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span>{type}</span>
              <span>{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="font-semibold text-lg">Detailed Risks</h2>
          {risks.length === 0 && <p>No risks detected.</p>}
          {risks.map((risk, idx) => (
            <div key={idx} className="border-l-4 pl-3 py-2 rounded-md border-primary/40">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{risk.type}</span>
                <Badge className={severityClassName[risk.severity] || "bg-gray-400"}>{risk.severity}</Badge>
              </div>
              <p className="text-sm mt-1">{risk.explanation}</p>
              <p className="text-xs text-gray-500 mt-1">Clause: "{risk.clause_excerpt}"</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
