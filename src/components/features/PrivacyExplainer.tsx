import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Shield, 
  Lock, 
  Database, 
  Network, 
  Eye, 
  EyeOff,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';

const PrivacyExplainer = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Your Data Stays Local",
      description: "All your learning data remains on your device. We never see your personal information, answers, or study patterns.",
      icon: Shield,
      color: "fl-success"
    },
    {
      title: "AI Models Learn Collectively",
      description: "Our AI improves by learning from patterns across all users, but without accessing individual data.",
      icon: Network,
      color: "fl-primary"
    },
    {
      title: "Encrypted Model Updates",
      description: "Only encrypted model improvements are shared, making it impossible to reverse-engineer personal data.",
      icon: Lock,
      color: "fl-secondary"
    },
    {
      title: "You Control Everything",
      description: "You decide what to share, when to participate, and can opt out at any time without losing access.",
      icon: Eye,
      color: "fl-accent"
    }
  ];

  const comparisonData = [
    {
      feature: "Your Personal Data",
      traditional: { status: "stored", icon: XCircle, color: "destructive" },
      federated: { status: "stays local", icon: CheckCircle, color: "fl-success" }
    },
    {
      feature: "Learning Progress",
      traditional: { status: "tracked centrally", icon: XCircle, color: "destructive" },
      federated: { status: "private to you", icon: CheckCircle, color: "fl-success" }
    },
    {
      feature: "AI Improvements",
      traditional: { status: "uses your data", icon: XCircle, color: "destructive" },
      federated: { status: "learns patterns only", icon: CheckCircle, color: "fl-success" }
    },
    {
      feature: "Data Breaches",
      traditional: { status: "exposes everything", icon: XCircle, color: "destructive" },
      federated: { status: "nothing to breach", icon: CheckCircle, color: "fl-success" }
    }
  ];

  return (
    <section id="privacy" className="py-20 bg-muted/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-fl-success/10 text-fl-success border-fl-success/20">
            <Shield className="w-4 h-4 mr-2" />
            Privacy by Design
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Privacy is Our Foundation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unlike traditional platforms that collect and store your data, we use federated learning 
            to provide personalized education while keeping your information completely private.
          </p>
        </motion.div>

        {/* Interactive Steps */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`cursor-pointer transition-all duration-300 ${
                  activeStep === index ? 'scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <Card className={`glass-card h-full ${activeStep === index ? 'ring-2 ring-fl-primary/50' : ''}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 bg-${step.color}/10 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <step.icon className={`w-6 h-6 text-${step.color}`} />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <div className={`w-8 h-1 bg-${step.color} rounded mx-auto ${activeStep === index ? 'opacity-100' : 'opacity-30'}`} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Active Step Details */}
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-xl text-center"
          >
            <h3 className="text-2xl font-bold mb-4">{steps[activeStep].title}</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {steps[activeStep].description}
            </p>
          </motion.div>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-2xl font-bold text-center mb-8">
            Traditional vs Federated Learning
          </h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Header */}
              <div className="p-4 bg-muted/20 font-semibold">Feature</div>
              <div className="p-4 bg-destructive/10 text-destructive font-semibold text-center">
                Traditional Platforms
              </div>
              <div className="p-4 bg-fl-success/10 text-fl-success font-semibold text-center">
                Our Federated Platform
              </div>

              {/* Comparison Rows */}
              {comparisonData.map((row, index) => (
                <React.Fragment key={row.feature}>
                  <div className="p-4 border-t border-muted font-medium">
                    {row.feature}
                  </div>
                  <div className={`p-4 border-t border-muted text-center text-${row.traditional.color} flex items-center justify-center gap-2`}>
                    <row.traditional.icon className="w-4 h-4" />
                    {row.traditional.status}
                  </div>
                  <div className={`p-4 border-t border-muted text-center text-${row.federated.color} flex items-center justify-center gap-2`}>
                    <row.federated.icon className="w-4 h-4" />
                    {row.federated.status}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Technical Deep Dive */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            Want to Understand the Technology?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Dive deeper into how federated learning works and why it's the future of privacy-preserving AI.
          </p>
          <Button className="bg-fl-primary hover:bg-fl-primary/90">
            Learn More About Federated Learning
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacyExplainer;