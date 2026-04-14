import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-cta" />
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Start analyzing your contracts today.
        </h2>
        <p className="text-muted-foreground mb-10 text-lg">
          Join thousands of legal professionals who trust LexaAI for faster, smarter contract review.
        </p>
        <Button variant="glow" size="xl" asChild>
          <Link to="/signup">
            Get Started
            <ArrowRight className="ml-1" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
};

export default CTASection;
