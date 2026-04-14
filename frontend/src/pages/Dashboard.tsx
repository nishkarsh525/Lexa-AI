import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, CheckCircle, Clock, FileText } from "lucide-react";

import { Contract, RiskAnalysis, api } from "@/lib/api";

type ContractWithRisk = Contract & {
  risk?: RiskAnalysis;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<ContractWithRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const contractsResponse = await api.get<Contract[]>("/contracts");
        const contractList = contractsResponse.data;

        const riskResults = await Promise.all(
          contractList.slice(0, 8).map(async (contract) => {
            try {
              const riskResponse = await api.get<RiskAnalysis>(`/contracts/${contract.id}/risk-analysis`);
              return { ...contract, risk: riskResponse.data };
            } catch {
              return contract;
            }
          }),
        );

        setContracts(riskResults);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const riskCount = contracts.reduce((sum, contract) => sum + (contract.risk?.total_risks || 0), 0);
    const reviewedCount = contracts.filter((contract) => contract.risk).length;
    const avgRiskScore = reviewedCount
      ? Math.round(
          contracts.reduce((sum, contract) => sum + (contract.risk?.risk_score || 0), 0) / reviewedCount,
        )
      : 0;

    return [
      { label: "Total Documents", value: `${contracts.length}`, icon: FileText, change: "Contracts indexed" },
      { label: "Risks Detected", value: `${riskCount}`, icon: AlertTriangle, change: "Across analyzed contracts" },
      { label: "Reviewed", value: `${reviewedCount}`, icon: CheckCircle, change: "With live analysis" },
      { label: "Avg. Risk Score", value: `${avgRiskScore}`, icon: Clock, change: "Portfolio average" },
    ];
  }, [contracts]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your contract analysis</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="glass rounded-2xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            <div className="text-xs text-primary/70 mt-2">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border/40">
          <h2 className="font-semibold">Recent Documents</h2>
        </div>
        <div className="divide-y divide-border/30">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading contracts...</div>
          ) : contracts.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No contracts yet. Upload one to start analysis.</div>
          ) : (
            contracts.map((contract, index) => {
              const risk = contract.risk?.overall_risk_level || "Pending";
              const status = contract.risk ? "Analyzed" : "Indexed";

              return (
                <motion.div
                  key={contract.id}
                  className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  onClick={() => navigate(`/dashboard/documents?contractId=${contract.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{contract.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(contract.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        risk === "High"
                          ? "bg-destructive/20 text-destructive"
                          : risk === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : risk === "Low"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {risk}
                    </span>
                    <span className={`text-xs ${status === "Analyzed" ? "text-primary" : "text-muted-foreground"}`}>
                      {status}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
