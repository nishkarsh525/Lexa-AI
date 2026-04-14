import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Shield } from "lucide-react";

import { Contract, RiskAnalysis, api } from "@/lib/api";

const COLORS = {
  Low: "hsl(153, 100%, 50%)",
  Medium: "hsl(45, 100%, 50%)",
  High: "hsl(0, 72%, 51%)",
};

const Analytics = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [risks, setRisks] = useState<Record<number, RiskAnalysis>>({});

  useEffect(() => {
    const load = async () => {
      const contractsResponse = await api.get<Contract[]>("/contracts");
      setContracts(contractsResponse.data);

      const entries = await Promise.all(
        contractsResponse.data.map(async (contract) => {
          try {
            const riskResponse = await api.get<RiskAnalysis>(`/contracts/${contract.id}/risk-analysis`);
            return [contract.id, riskResponse.data] as const;
          } catch {
            return null;
          }
        }),
      );

      setRisks(Object.fromEntries(entries.filter(Boolean) as [number, RiskAnalysis][]));
    };

    load();
  }, []);

  const clauseData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(risks).forEach((risk) => {
      risk.risks.forEach((item) => {
        counts[item.type] = (counts[item.type] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [risks]);

  const riskDistribution = useMemo(() => {
    const distribution = { Low: 0, Medium: 0, High: 0 };
    Object.values(risks).forEach((risk) => {
      distribution[risk.overall_risk_level] += 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name as keyof typeof COLORS],
    }));
  }, [risks]);

  const trendData = useMemo(() => {
    return contracts
      .map((contract) => ({
        month: new Date(contract.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        score: risks[contract.id]?.risk_score || 0,
      }))
      .slice(-6);
  }, [contracts, risks]);

  const healthScore = useMemo(() => {
    const analyzed = Object.values(risks);
    if (!analyzed.length) {
      return 0;
    }
    const averageRisk = analyzed.reduce((sum, risk) => sum + risk.risk_score, 0) / analyzed.length;
    return Math.max(0, 100 - Math.round(averageRisk));
  }, [risks]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Risk Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Live insights from uploaded contracts</p>
      </div>

      <motion.div
        className="glass rounded-2xl p-6 flex items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">
            {healthScore}
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <div className="text-sm text-muted-foreground">Portfolio Health Score</div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4">Clause Frequency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clauseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 22%, 15%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(220, 9%, 60%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(220, 9%, 60%)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "hsl(150, 18%, 8%)", border: "1px solid hsl(150, 22%, 15%)", borderRadius: "12px", color: "hsl(220, 9%, 91%)" }} />
              <Bar dataKey="count" fill="hsl(153, 100%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="font-semibold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {riskDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(150, 18%, 8%)", border: "1px solid hsl(150, 22%, 15%)", borderRadius: "12px", color: "hsl(220, 9%, 91%)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-muted-foreground">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div className="glass rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="font-semibold mb-4">Recent Risk Score Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 22%, 15%)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(220, 9%, 60%)", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(220, 9%, 60%)", fontSize: 12 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "hsl(150, 18%, 8%)", border: "1px solid hsl(150, 22%, 15%)", borderRadius: "12px", color: "hsl(220, 9%, 91%)" }} />
            <Line type="monotone" dataKey="score" stroke="hsl(153, 100%, 50%)" strokeWidth={2} dot={{ fill: "hsl(153, 100%, 50%)", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default Analytics;
