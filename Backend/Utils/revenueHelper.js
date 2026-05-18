const RevenueTransaction = require('../models/RevenueTransaction');

const recordRevenue = async (data) => {
  try {
    const transaction = new RevenueTransaction({
      transactionId: `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionType: data.transactionType,
      source: data.source,
      amount: data.amount,
      paymentMethod: data.paymentMethod || 'cash',
      paymentDetails: data.paymentDetails || {},
      patientId: data.patientId,
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      doctorName: data.doctorName,
      doctorId: data.doctorId,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      items: data.items || [],
      description: data.description,
      notes: data.notes,
      transactionDate: data.transactionDate || new Date(),
      processedBy: data.processedBy,
      processedByName: data.processedByName,
      status: 'completed'
    });

    await transaction.save();
    console.log(`✅ Revenue recorded: ${transaction.transactionId} - $${data.amount} - ${data.source}`);
    return transaction;
  } catch (error) {
    console.error('❌ Error recording revenue:', error.message);
    return null;
  }
};

const recordAppointmentPayment = async (appointment, paymentData, userId, userName) => {
  return await recordRevenue({
    transactionType: 'doctor_consultation_fee',
    source: 'Doctor Consultation Fee',
    amount: paymentData.paidAmount,
    paymentMethod: paymentData.paymentMethod,
    paymentDetails: {
      mobileNumber: paymentData.mobileNumber,
      bankLast4: paymentData.bankLast4
    },
    patientId: appointment._id,
    patientName: appointment.childName,
    patientPhone: appointment.parentPhone,
    referenceId: appointment.ticketId,
    referenceType: 'appointment',
    description: `Doctor consultation fee for appointment ${appointment.ticketId} - ${appointment.childName}`,
    processedBy: userId,
    processedByName: userName,
    transactionDate: paymentData.paymentDate || new Date()
  });
};

const recordInpatientPayment = async (inpatient, paymentData, userId, userName) => {
  return await recordRevenue({
    transactionType: 'inpatient_stay',
    source: 'Inpatient Stay',
    amount: paymentData.paidAmount,
    paymentMethod: paymentData.paymentMethod,
    paymentDetails: {
      mobileNumber: paymentData.mobileNumber,
      bankLast4: paymentData.bankLast4
    },
    patientId: inpatient.patientId,
    patientName: inpatient.childName,
    patientPhone: inpatient.parentPhone,
    referenceId: inpatient.inpatientId || inpatient._id,
    referenceType: 'inpatient',
    description: `${inpatient.nightsCount || 0} nights stay - Room ${inpatient.roomNumber}, Bed ${inpatient.bedNumber}`,
    items: [{
      name: 'Room Charges',
      quantity: inpatient.nightsCount || 0,
      price: inpatient.nightlyRate || 0,
      subtotal: (inpatient.nightsCount || 0) * (inpatient.nightlyRate || 0)
    }],
    processedBy: userId,
    processedByName: userName,
    transactionDate: paymentData.paymentDate || new Date()
  });
};

const recordRegistrationPayment = async (patient, paymentData, userId, userName) => {
  const transactions = [];
  
  if (patient.referredTo === 'doctor' && paymentData.doctorFee > 0) {
    const doctorFeeTx = await recordRevenue({
      transactionType: 'doctor_consultation_fee',
      source: 'Doctor Consultation Fee',
      amount: paymentData.doctorFee,
      paymentMethod: paymentData.paymentMethod,
      paymentDetails: paymentData.paymentDetails,
      patientId: patient._id,
      patientName: patient.childName,
      patientPhone: patient.parentPhone,
      referenceId: patient.ticketId,
      referenceType: 'patient_registration',
      description: `Doctor consultation fee for ${patient.childName}`,
      processedBy: userId,
      processedByName: userName,
      transactionDate: paymentData.paymentDate
    });
    if (doctorFeeTx) transactions.push(doctorFeeTx);
  }
  
  if (patient.referredTo === 'lab-tech' && paymentData.labTotal > 0) {
    const labTx = await recordRevenue({
      transactionType: 'lab_test_registration',
      source: 'Lab Tests (Walk-in)',
      amount: paymentData.labTotal,
      paymentMethod: paymentData.paymentMethod,
      paymentDetails: paymentData.paymentDetails,
      patientId: patient._id,
      patientName: patient.childName,
      patientPhone: patient.parentPhone,
      referenceId: patient.ticketId,
      referenceType: 'patient_registration',
      description: `Lab tests requested at registration: ${paymentData.labTestsCount} test(s) for ${patient.childName}`,
      items: paymentData.labItems || [],
      processedBy: userId,
      processedByName: userName,
      transactionDate: paymentData.paymentDate
    });
    if (labTx) transactions.push(labTx);
  }
  
  return transactions;
};

const recordLabPayment = async (labPayment, paymentData, userId, userName) => {
  return await recordRevenue({
    transactionType: 'lab_test_doctor',
    source: 'Lab Tests (Doctor Request)',
    amount: paymentData.paidAmount,
    paymentMethod: paymentData.paymentMethod,
    paymentDetails: {
      mobileNumber: paymentData.mobileNumber,
      bankLast4: paymentData.bankLast4
    },
    patientId: labPayment.patientId,
    patientName: labPayment.childName,
    patientPhone: labPayment.parentPhone,
    doctorName: labPayment.doctorName,
    referenceId: labPayment.consultationId,
    referenceType: 'consultation',
    description: `Lab tests requested by Dr. ${labPayment.doctorName} for ${labPayment.childName}`,
    items: labPayment.labTests.map(test => ({ name: test.name, price: test.price })),
    processedBy: userId,
    processedByName: userName,
    transactionDate: paymentData.paymentDate || new Date()
  });
};

const recordPharmacyPayment = async (prescription, paymentData, userId, userName) => {
  return await recordRevenue({
    transactionType: 'pharmacy_prescription',
    source: 'Pharmacy Prescription',
    amount: paymentData.paidAmount,
    paymentMethod: paymentData.paymentMethod,
    paymentDetails: paymentData.paymentDetails,
    patientId: prescription.patientId,
    patientName: prescription.patientName,
    patientPhone: prescription.parentPhone,
    doctorName: prescription.doctor,
    doctorId: prescription.doctorId,
    referenceId: prescription.prescriptionId,
    referenceType: 'prescription',
    description: `Prescription for ${prescription.patientName}`,
    items: prescription.medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      quantity: med.quantity || 1,
      price: med.price || 0
    })),
    processedBy: userId,
    processedByName: userName,
    transactionDate: paymentData.paymentDate || new Date()
  });
};

const recordWalkinSalePayment = async (sale, paymentData, userId, userName) => {
  return await recordRevenue({
    transactionType: 'walkin_sale',
    source: 'Walk-in Sale',
    amount: paymentData.paidAmount,
    paymentMethod: paymentData.paymentMethod,
    paymentDetails: paymentData.paymentDetails,
    patientName: sale.customerName || 'Walk-in Customer',
    patientPhone: sale.customerPhone,
    referenceId: sale.saleId,
    referenceType: 'walkin_sale',
    description: `${sale.items.length} item(s) sold`,
    items: sale.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.quantity * item.price
    })),
    processedBy: userId,
    processedByName: userName,
    transactionDate: paymentData.paymentDate || new Date()
  });
};

const getRevenueSummary = async (startDate, endDate) => {
  try {
    const query = {};
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = startDate;
      if (endDate) query.transactionDate.$lte = endDate;
    }

    const [total, bySource, byPaymentMethod] = await Promise.all([
      RevenueTransaction.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      RevenueTransaction.aggregate([
        { $match: query },
        { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      RevenueTransaction.aggregate([
        { $match: query },
        { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalRevenue: total[0]?.total || 0,
      totalTransactions: total[0]?.count || 0,
      bySource: bySource,
      byPaymentMethod: byPaymentMethod
    };
  } catch (error) {
    console.error('Error getting revenue summary:', error);
    return null;
  }
};

module.exports = { 
  recordRevenue,
  recordAppointmentPayment,
  recordRegistrationPayment,
  recordLabPayment,
  recordInpatientPayment,
  recordPharmacyPayment,
  recordWalkinSalePayment,
  getRevenueSummary
};