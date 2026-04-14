import { motion } from "framer-motion";
import { FileText, AlertTriangle, Search } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Summarization",
    description: "Get instant, accurate summaries of complex legal documents. Key clauses and obligations extracted automatically.",
  },
  {
    icon: AlertTriangle,
    title: "Risk Detection Engine",
    description: "Identify hidden risks, unfavorable terms, and potential liability exposure before you sign.",
  },
  {
    icon: Search,
    title: "Clause Comparison",
    description: "Compare clauses across multiple contracts to ensure consistency and identify deviations from standard terms.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Powerful <span className="text-gradient-green">Features</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to analyze, understand, and manage legal documents with confidence.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group glass rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 glow-green-hover cursor-default"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
