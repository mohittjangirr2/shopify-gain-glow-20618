export interface FeeSettings {
  paymentGateway: {
    enabled: boolean;
    fee: number; // percentage
  };
  marketer: {
    enabled: boolean;
    type: "percentage" | "fixed";
    value: number;
  };
  codRemittance: {
    fee: number; // fixed amount
  };
}

export const getDefaultSettings = (): FeeSettings => {
  const stored = localStorage.getItem("dashboardSettings");
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    paymentGateway: {
      enabled: true,
      fee: 2,
    },
    marketer: {
      enabled: false,
      type: "percentage",
      value: 0,
    },
    codRemittance: {
      fee: 0.49,
    },
  };
};

export const calculateOrderFees = (
  order: any,
  settings: FeeSettings
) => {
  let fees = 0;
  let breakdown: Record<string, number> = {};

  // Payment gateway fee (prepaid only)
  if (settings.paymentGateway.enabled && order.paymentMethod?.toLowerCase() === 'prepaid') {
    const gatewayFee = (order.orderValue * settings.paymentGateway.fee) / 100;
    fees += gatewayFee;
    breakdown.paymentGateway = gatewayFee;
  }

  // COD remittance fee
  if (order.paymentMethod?.toLowerCase() === 'cod') {
    fees += settings.codRemittance.fee;
    breakdown.codRemittance = settings.codRemittance.fee;
  }

  // Marketer commission
  if (settings.marketer.enabled) {
    const marketerFee =
      settings.marketer.type === "percentage"
        ? (order.profit * settings.marketer.value) / 100
        : settings.marketer.value;
    fees += marketerFee;
    breakdown.marketer = marketerFee;
  }

  return { totalFees: fees, breakdown };
};

export const calculateTotalFees = (
  orders: any[],
  settings: FeeSettings
) => {
  let totalFees = 0;
  let totalBreakdown: Record<string, number> = {
    paymentGateway: 0,
    codRemittance: 0,
    marketer: 0,
  };

  orders.forEach((order) => {
    const { totalFees: orderFees, breakdown } = calculateOrderFees(order, settings);
    totalFees += orderFees;
    
    Object.keys(breakdown).forEach((key) => {
      totalBreakdown[key] = (totalBreakdown[key] || 0) + breakdown[key];
    });
  });

  return { totalFees, breakdown: totalBreakdown };
};
