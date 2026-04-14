import { motion } from "framer-motion";
import { Upload, Cpu, BarChart3 } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload Document", description: "Drag and drop your PDF or DOCX contract" },
  { icon: Cpu, title: "AI Analysis", description: "Our AI engine processes and analyzes every clause" },
  { icon: BarChart3, title: "Risk Report & Insights", description: "Get a comprehensive risk report with actionable insights" },
];

const HowItWorksSection = () => {
  return (
    <section className="py-32 px-6 relative bg-surface">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            How It <span className="text-gradient-green">Works</span>
          </h2>
          <p className="text-muted-foreground">Three simple steps to smarter contract analysis.</p>
        </motion.div>

        <div className="relative flex flex-col md:flex-row items-start justify-between gap-12">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="flex-1 text-center relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl glass glow-green-sm mb-6">
                <step.icon className="w-8 h-8 text-primary" />
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
