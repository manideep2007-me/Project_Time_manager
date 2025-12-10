const { validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

function validateSalaryData(req, res, next) {
  const {
    employee_id,
    salary_type,
    salary_amount,
    hourly_rate,
    effective_date
  } = req.body;
  
  const errors = [];
  
  // Required fields validation
  if (!employee_id) {
    errors.push('Employee ID is required');
  }
  
  if (!salary_type) {
    errors.push('Salary type is required');
  } else if (!['hourly', 'daily', 'monthly'].includes(salary_type)) {
    errors.push('Salary type must be hourly, daily, or monthly');
  }
  
  if (!salary_amount || salary_amount <= 0) {
    errors.push('Salary amount is required and must be greater than 0');
  }
  
  if (!effective_date) {
    errors.push('Effective date is required');
  } else {
    const date = new Date(effective_date);
    if (isNaN(date.getTime())) {
      errors.push('Effective date must be a valid date');
    }
  }
  
  // Hourly rate validation for hourly salary type
  if (salary_type === 'hourly' && (!hourly_rate || hourly_rate <= 0)) {
    errors.push('Hourly rate is required for hourly salary type');
  }
  
  // End date validation
  if (req.body.end_date) {
    const endDate = new Date(req.body.end_date);
    const startDate = new Date(effective_date);
    
    if (isNaN(endDate.getTime())) {
      errors.push('End date must be a valid date');
    } else if (endDate <= startDate) {
      errors.push('End date must be after effective date');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }
  
  next();
}

module.exports = { handleValidation, validateSalaryData };

