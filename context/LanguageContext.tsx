
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define available languages
export type Language = 'am' | 'en';

// Define the translations structure
interface Translations {
  [key: string]: {
    [key: string]: {
      am: string;
      en: string;
    };
  };
}

// Create translations object
export const translations: Translations = {
  // Common
  common: {
    save: {
      am: 'አስቀምጥ',
      en: 'Save'
    },
  
  available: {
    am: 'አለ',
    en: 'Available'
  },

  TelegramChat:{
    am:"የቴሌግራም ቻት",
    en: "Telegram Chat"

  },

  price: {
    am: 'ዋጋ',
    en: 'Price'
  },
  total: {
    am: 'ድምር',
    en: 'Total'
  },
    connectionError: {
    am: 'ከአገልጋይ ጋር መገናኘት አልተቻለም',
    en: 'Could not connect to server'
  },
  unexpectedError: {
    am: 'ያልተጠበቀ ስህተት ተከስቷል',
    en: 'An unexpected error occurred'
  },

  app: {
    am: 'ስፔሲፊክ ኢትዮጵያ መተግበሪያ',
    en: 'Specific Ethiopia Application'
  },



  website: {
    am: 'ድረ-ገጽ',
    en: 'Website'
  },
  deleting: {
    am: 'እየሰረዘ ነው...',
    en: 'Deleting...'
  },
    cancel: {
      am: 'ሰርዝ',
      en: 'Cancel'
    },
    add: {
      am: 'ጨምር',
      en: 'Add'
    },
    edit: {
      am: 'አርትዕ',
      en: 'Edit'
    },
    delete: {
      am: 'ሰርዝ',
      en: 'Delete'
    },
    loading: {
      am: 'በመጫን ላይ...',
      en: 'Loading...'
    },
    success: {
      am: 'ተሳክቷል',
      en: 'Success'
    },
    error: {
      am: 'ስህተት',
      en: 'Error'
    },
    deleteFailed: {
      am: 'መሰረዝ አልተሳካም',
      en: 'Delete failed'
    },
    confirm: {
      am: 'አረጋግጥ',
      en: 'Confirm'
    },
    back: {
      am: 'ተመለስ',
      en: 'Back'
    },
    trader: {
      am: 'እንኳን ደህና መጡ',
      en: 'Welcome,',
    },
    dataLoadFailed: {
      am: 'ዳታ መጫን አልተቻለም',
      en: 'Failed to load data'
    },
    status: {
      am: 'ሁኔታ',
      en: 'Status'
    },
    filter: {
      am: 'ማጣሪያ',
      en: 'Filter'
    },


  password: {
    am: 'የይለፍ ቃል',
    en: 'Password'
  },
  comingSoon: {
    am: 'እስካሁን አልተዘጋጀም',
    en: 'Coming Soon'
  },

  
  all: {
    am: 'ሁሉም',
    en: 'All'
  },
  other: {
    am: 'ሌሎች',
    en: 'Other'
  },
  outOfStock: {
    am: 'አልቀረም',
    en: 'Out of Stock'
  },
  low: {
    am: 'ዝቅተኛ',
    en: 'Low'
  },
  sufficient: {
    am: 'በቂ',
    en: 'Sufficient'
  },
    paid: {
      am: 'ተከፍሏል',
      en: 'Paid'
    },
    due: {
      am: 'ዕዳ',
      en: 'Due'
    },
    items: {
      am: 'እቃዎች',
      en: 'items'
    },
    from: {
      am: 'ከ',
      en: 'from'
    },
    sales: {
      am: 'ሽያጮች',
      en: 'sales'
    },
    remaining: {
      am: 'ቀሪ',
      en: 'Remaining'
    },
    viewDetails: {
      am: 'ዝርዝር ለማየት',
      en: 'View Details'
    },
    close: {
      am: 'ዝጋ',
      en: 'Close'
    },
    products: {
      am: 'ምርቶች',
      en: 'products'
    },
    viewAll: {
      am: 'ሁሉንም ተመልከት',
      en: 'View All'
    },
    noProducts: {
      am: 'ምንም ምርቶች አልተገኙም',
      en: 'No products found'
    },
    today: {
    am: 'ዛሬ',
    en: 'Today'
  },
  week: {
    am: 'ሳምንት',
    en: 'Week'
  },
  month: {
    am: 'ወር',
    en: 'Month'
  },

    newSale: {
      am: 'አዲስ ሽያጭ',
      en: 'New Sale'
    },
    allProducts: {
      am: 'ሁሉም ምርቶች',
      en: 'All Products'
    },
    salesHistory: {
      am: 'ሽያጭ ታሪክ',
      en: 'Sales History'
    },
    support: {
      am: 'እገዛ እና ድጋፍ',
      en: 'Support'
    },
    supportMessage: {
      am: 'እንዴት ልንረዳዎ እንችላለን?',
      en: 'How can we help you?'
    },
    call: {
      am: 'ስልክ ደውል',
      en: 'Call'
    },
    email: {
      am: 'ኢሜይል ላክ',
      en: 'Email'
    },
    notifications: {
      am: 'ማሳወቂያዎች',
      en: 'Notifications'
    },
    noNotifications: {
      am: 'አዲስ ማሳወቂያ የለም',
      en: 'No new notifications'
    },
    quickAction: {
      am: 'ፈጣን እርምጃ',
      en: 'Quick Action'
    },
    quickActionMessage: {
      am: 'ምን ማድረግ ይፈልጋሉ?',
      en: 'What would you like to do?'
    },
    currency: {
      am: 'ብር',
      en: 'ETB'
    },
    locale: {
      am: 'am-ET',
      en: 'en-US'
    },
    deleteSuccess: {
      am: 'ምርት በተሳካ ሁኔታ ተሰርዟል',
      en: 'Product deleted successfully'
    },
    backToProducts: {
      am: 'ወደ ምርቶች ተመለስ',
      en: 'Back to Products'
    },
    updated: {
      am: 'ተሻሽሏል',
      en: 'Updated'
    },
    updateFailed: {
      am: 'ማሻሻል አልተሳካም',
      en: 'Update failed'
    },
    enter: {
      am: 'አስገባ',
      en: 'Enter'
    },
    id: {
      am: 'መለያ ቁጥር',
      en: 'ID'
    },
    created: {
      am: 'የተፈጠረ',
      en: 'Created'
    },
    loginRequired: {
      am: 'እባክዎ እንደገና ይግቡ',
      en: 'Please login again'
    },
    none: {
      am: 'የለም',
      en: 'None'
    },

    critical: {
      am: 'አጣዳፊ',
      en: 'Critical'
    },
 
    normal: {
      am: 'መደበኛ',
      en: 'Normal'
    },
    stockLimits: {
      am: 'የክምችት ገደቦች',
      en: 'Stock Limits'
    },
    stockMovement: {
      am: 'የክምችት እንቅስቃሴ',
      en: 'Stock Movement'
    },
    profitPerUnit: {
      am: 'ትርፍ በአንዱ',
      en: 'Profit per Unit'
    },
    totalProfit: {
      am: 'ጠቅላላ ትርፍ',
      en: 'Total Profit'
    },
    profitMargin: {
      am: 'ትርፍ %',
      en: 'Profit Margin'
    },
    deleteConfirmTitle: {
      am: 'ምርት ሰርዝ?',
      en: 'Delete Product?'
    },
    deleteConfirmMessage: {
      am: 'ይህን ምርት መሰረዝ እንደምትፈልግ እርግጠኛ ነህ?',
      en: 'Are you sure you want to delete this product?'
    },
    inactivate: {
      am: 'አታሳይ',
      en: 'Inactivate'
    },
    inactivating: {
      am: 'እያገደ ነው...',
      en: 'Inactivating...'
    },
    inactivateSuccess: {
      am: 'ምርት በተሳካ ሁኔታ ታግዷል',
      en: 'Product inactivated successfully'
    },
    inactivateFailed: {
      am: 'ምርት ማገድ አልተሳካም',
      en: 'Failed to inactivate product'
    },
    inactivateConfirmTitle: {
      am: 'ምርት ይታገድ?',
      en: 'Inactivate Product?'
    },
    inactivateConfirmMessage: {
      am: 'ይህንን ምርት ማገድ እንደሚፈልጉ እርግጠኛ ነዎት?',
      en: 'Are you sure you want to inactivate this product?'
    },
    activate: {
      am: 'አሳይ',
      en: 'Activate'
    },
    activating: {
      am: 'እያነቃ ነው...',
      en: 'Activating...'
    },
    activateSuccess: {
      am: 'ምርት በተሳካ ሁኔታ ነቅቷል',
      en: 'Product activated successfully'
    },
    activateFailed: {
      am: 'ምርት ማንቃት አልተሳካም',
      en: 'Failed to activate product'
    },
    inactiveProducts: {
      am: 'የታገዱ ምርቶች',
      en: 'Inactive Products'
    },
    statusActive: {
      am: 'በስራ ላይ ያሉ',
      en: 'Active Products'
    },
    statusInactive: {
      am: 'የታገዱ ምርቶች',
      en: 'Inactive Products'
    },
    deletePermanent: {
      am: 'በትክክል ሰርዝ',
      en: 'Permanent Delete'
    },
    permanentlyDeleteConfirmTitle: {
      am: 'ለዘለቄታው ይሰረዝ?',
      en: 'Permanently Delete?'
    },
    permanentlyDeleteConfirmMessage: {
      am: 'ይህንን ምርት ለዘለቄታው መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት? ይህ ድርጊት ሊቀለበስ አይችልም እና የሚፈቀደው ምንም የሽያጭ ታሪክ ለሌላቸው ምርቶች ብቻ ነው።',
      en: 'Are you sure you want to permanently delete this product? This action cannot be undone and is only allowed for products with no sales.'
    }
  },


  
  // Navigation
  navigation: {
    home: {
      am: 'መነሻ',
      en: 'Home'
    },
    products: {
      am: 'ምርቶች',
      en: 'Products'
    },
    sales: {
      am: 'ሽያጭ',
      en: 'Sales'
    },
    purchases: {
      am: 'ግዢ',
      en: 'Purchases'
    },
    reports: {
      am: 'ሪፖርቶች',
      en: 'Reports'
    },
    settings: {
      am: 'ቅንብሮች',
      en: 'Settings'
    },
    profile: {
      am: 'መገለጫ',
      en: 'Profile'
    },
    inventory: {
      am: 'ክምችት',
      en: 'Inventory'
    },
    inactive: {
      am: 'የታገዱ',
      en: 'Inactive'
    },

  },
  
  // Add Product Screen
  addProduct: {
    title: {
      am: 'አዲስ ምርት ጨምር',
      en: 'Add New Product'
    },
    basicInfo: {
      am: 'መሰረታዊ መረጃ',
      en: 'Basic Information'
    },
    details: {
      am: 'ዝርዝር መረጃ',
      en: 'Details'
    },
    pricing: {
      am: 'ዋጋ',
      en: 'Pricing'
    },
    stock: {
      am: 'ክምችት አስተዳደር',
      en: 'Stock Management'
    },
    additional: {
      am: 'ተጨማሪ መረጃ',
      en: 'Additional Information'
    },
    productName: {
      am: 'የምርት ስም *',
      en: 'Product Name *'
    },
    productNamePlaceholder: {
      am: 'ለምሳሌ: ብሬክ ፓድ',
      en: 'E.g., Brake Pad'
    },
    productCode: {
      am: 'የምርት ኮድ *',
      en: 'Product Code *'
    },
    productCodePlaceholder: {
      am: 'BP-001',
      en: 'BP-001'
    },
    category: {
      am: 'ምድብ',
      en: 'Category'
    },
    categoryPlaceholder: {
      am: 'ለምሳሌ: ብሬክ ሲስተም',
      en: 'E.g., Brake System'
    },
    brand: {
      am: 'ብራንድ',
      en: 'Brand'
    },
    brandPlaceholder: {
      am: 'ለምሳሌ: Bosch',
      en: 'E.g., Bosch'
    },
    description: {
      am: 'መግለጫ',
      en: 'Description'
    },
    descriptionPlaceholder: {
      am: 'ስለ ምርቱ ዝርዝር መረጃ...',
      en: 'Detailed information about the product...'
    },
    unit: {
      am: 'መለኪያ',
      en: 'Unit'
    },
    unitPlaceholder: {
      am: 'pcs',
      en: 'pcs'
    },
    buyingPrice: {
      am: 'የግዢ ዋጋ',
      en: 'Buying Price'
    },
    sellingPrice: {
      am: 'የሽያጭ ዋጋ *',
      en: 'Selling Price *'
    },
    profit: {
      am: 'ትርፍ',
      en: 'Profit'
    },
    totalStock: {
      am: 'አጠቃላይ ክምችት',
      en: 'Total Stock'
    },
    minStock: {
      am: 'ዝቅተኛ ክምችት',
      en: 'Minimum Stock'
    },
    maxStock: {
      am: 'ከፍተኛ ክምችት',
      en: 'Maximum Stock'
    },
    newArrival: {
      am: 'አዲስ የደረሰ',
      en: 'New Arrival'
    },
    soldQuantity: {
      am: 'የተሸጠ ብዛት',
      en: 'Sold Quantity'
    },
    location: {
      am: 'መገኛ',
      en: 'Location'
    },
    locationPlaceholder: {
      am: 'መደርደሪያ ቁጥር',
      en: 'Shelf Number'
    },
    supplierId: {
      am: 'አቅራቢ መለያ',
      en: 'Supplier ID'
    },
    supplierIdPlaceholder: {
      am: 'SUP-001',
      en: 'SUP-001'
    },
    active: {
      am: 'ንቁ',
      en: 'Active'
    },
    inactive: {
      am: 'የተቋረጠ',
      en: 'Inactive'
    },
    addProduct: {
      am: 'ምርቱን ጨምር',
      en: 'Add Product'
    },
    validation: {
      am: 'ማረጋገጫ',
      en: 'Validation'
    },
    productNameRequired: {
      am: 'የምርት ስም ያስፈልጋል',
      en: 'Product name is required'
    },
    productCodeRequired: {
      am: 'የምርት ኮድ ያስፈልጋል',
      en: 'Product code is required'
    },
    validSellingPrice: {
      am: 'ትክክለኛ የሽያጭ ዋጋ ያስገቡ',
      en: 'Enter a valid selling price'
    },
    successMessage: {
      am: 'ምርት በተሳካ ሁኔታ ተጨምሯል',
      en: 'Product added successfully'
    },
    goToProducts: {
      am: 'ወደ ምርቶች ይሂዱ',
      en: 'Go to Products'
    },
    addAnother: {
      am: 'ሌላ ጨምር',
      en: 'Add Another'
    },
  },
  
  // Settings Screen
  settings: {
    language: {
      am: 'ቋንቋ',
      en: 'Language'
    },
    amharic: {
      am: 'አማርኛ',
      en: 'Amharic'
    },
    english: {
      am: 'እንግሊዝኛ',
      en: 'English'
    },
    theme: {
      am: 'ቀለም',
      en: 'Theme'
    },
    dark: {
      am: 'ጨለማ',
      en: 'Dark'
    },
    light: {
      am: 'ብርሃን',
      en: 'Light'
    },
    system: {
      am: 'ሲስተም',
      en: 'System'
    },
    notifications: {
      am: 'ማሳወቂያዎች',
      en: 'Notifications'
    },
    about: {
      am: 'ስለ አፕሉ',
      en: 'About'
    }
  },

  // Dashboard
  dashboard: {
    totalProducts: {
      am: 'አጠቃላይ ምርቶች',
      en: 'Total Products'
    },
    totalStock: {
      am: 'አጠቃላይ ክምችት',
      en: 'Total Stock'
    },
    todaySales: {
      am: 'የዛሬ ሽያጮች',
      en: "Today's Sales"
    },
    totalRevenue: {
      am: 'አጠቃላይ ገቢ',
      en: 'Total Revenue'
    },
    lowStockWarning: {
      am: 'ዝቅተኛ ክምችት ማስጠንቀቂያ',
      en: 'Low Stock Warning'
    },
    lowStockSingle: {
      am: 'አንድ ምርት ክምችት ማዘዝ ያስፈልገዋል',
      en: 'One product needs to be reordered'
    },
    lowStockMultiple: {
      am: '{count} ምርቶች ክምችት ማዘዝ ያስፈልጋቸዋል',
      en: '{count} products need to be reordered'
    },
    recentSales: {
      am: 'የቅርብ ጊዜ ሽያጮች',
      en: 'Recent Sales'
    },
    recentProducts: {
      am: 'የቅርብ ጊዜ ምርቶች',
      en: 'Recent Products'
    },
    quickActions: {
      am: 'ፈጣን እርምጃዎች',
      en: 'Quick Actions'
    }
  },





  // Add auth section
auth: {
  welcome: {
    am: 'እንኳን ደህና መጡ',
    en: 'Welcome'
  },
  welcomeBack: {
    am: 'እንኳን ደህና መጡ',
    en: 'Welcome Back'
  },
  loginDescription: {
    am: 'የእቃ ክምችትዎን ለማስተዳደር ይግቡ',
    en: 'Sign in to manage your inventory'
  },
  emailPasswordRequired: {
    am: 'ኢሜይል እና የይለፍ ቃል ያስፈልጋል',
    en: 'Email and password are required'
  },
  tokenNotFound: {
    am: 'ቶከን አልተገኘም',
    en: 'Token not found'
  },
  invalidCredentials: {
    am: 'እባክዎ ኢሜይል እና የይለፍ ቃልዎን ያረጋግጡ',
    en: 'Please check your email and password'
  },
  forgotPassword: {
    am: 'ፓስዎርድ ረሳሁ?',
    en: 'Forgot Password?'
  },
  rememberMe: {
    am: 'ይህን መሣሪያ አስታውስ',
    en: 'Remember Me'
  },
  login: {
    am: 'ግባ',
    en: 'Sign In'
  },
  newUser: {
    am: 'ለመጀመሪያ ጊዜ ነው?',
    en: 'New here?'
  },
  createAccount: {
    am: 'አዲስ መለያ ፍጠር',
    en: 'Create Account'
  },

  enterEmailInstructions: {
    am: 'የይለፍ ቃልዎን ለማስመለስ ኢሜይል ያስገቡ',
    en: 'Enter your email to reset your password'
  },
  sendCode: {
    am: 'ኮድ ላክ',
    en: 'Send Code'
  },
  backToLogin: {
    am: 'ወደ መግቢያ ተመለስ',
    en: 'Back to Login'
  },
  verifyCode: {
    am: 'ኮድ አረጋግጥ',
    en: 'Verify Code'
  },
  enterCodeInstructions: {
    am: 'ወደ {email} የተላከውን 6 አሃዝ ኮድ ያስገቡ',
    en: 'Enter the 6-digit code sent to {email}'
  },
  verify: {
    am: 'አረጋግጥ',
    en: 'Verify'
  },
  didntReceiveCode: {
    am: 'ኮድ አልደረሰም?',
    en: "Didn't receive the code?"
  },
  resend: {
    am: 'እንደገና ላክ',
    en: 'Resend'
  },
  resendIn: {
    am: 'እንደገና ለመላክ {timer} ሰከንድ',
    en: 'Resend in {timer}s'
  },
  changeEmail: {
    am: 'ኢሜይል ቀይር',
    en: 'Change Email'
  },
  resetPassword: {
    am: 'የይለፍ ቃል ቀይር',
    en: 'Reset Password'
  },
  enterNewPasswordInstructions: {
    am: 'አዲስ የይለፍ ቃል ያስገቡ',
    en: 'Enter your new password'
  },
  newPassword: {
    am: 'አዲስ የይለፍ ቃል',
    en: 'New Password'
  },
  confirmPassword: {
    am: 'አዲስ የይለፍ ቃል ድገም',
    en: 'Confirm New Password'
  },
  emailRequired: {
    am: 'ኢሜይል ያስፈልጋል',
    en: 'Email is required'
  },
  validCodeRequired: {
    am: 'እባክዎ ትክክለኛ 6 አሃዝ ኮድ ያስገቡ',
    en: 'Please enter a valid 6-digit code'
  },
  invalidCode: {
    am: 'ልክ ያልሆነ ወይም ጊዜው ያለፈበት ኮድ',
    en: 'Invalid or expired code'
  },
  passwordResetSuccess: {
    am: 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል። እባክዎ ይግቡ',
    en: 'Your password has been reset successfully. Please login'
  },

  fillAllFields: {
    am: 'እባክዎ ሁሉንም መስኮች ይሙሉ',
    en: 'Please fill all fields'
  },
  validEmail: {
    am: 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ',
    en: 'Please enter a valid email'
  },
  validPhone: {
    am: 'የስልክ ቁጥር ቅርጸት ትክክል አይደለም',
    en: 'Phone number format is invalid'
  },
  agreeTermsRequired: {
    am: 'ለመቀጠል ውሎችን መቀበል አለብዎት',
    en: 'You must agree to the terms to continue'
  },
  registrationSuccess: {
    am: 'መለያዎ በተሳካ ሁኔታ ተፈጥሯል። እባክዎ ይግቡ',
    en: 'Your account has been created successfully. Please login'
  },
  registrationFailed: {
    am: 'ምዝገባ አልተሳካም',
    en: 'Registration failed'
  },
  usernameExists: {
    am: 'ይህ የተጠቃሚ ስም አስቀድሞ ተመዝግቧል',
    en: 'This username already exists'
  },
  emailExists: {
    am: 'ይህ ኢሜይል አስቀድሞ ተመዝግቧል',
    en: 'This email already exists'
  },
  goToLogin: {
    am: 'ወደ መግቢያ ይሂዱ',
    en: 'Go to Login'
  },
  heroTitle: {
    am: 'Join AutoParts Pro',
    en: 'Join AutoParts Pro'
  },
  heroSubtitle: {
    am: 'Scale your automotive business today.',
    en: 'Scale your automotive business today.'
  },
  ethiopianBadge: {
    am: 'ለኢትዮጵያ ንግድ የተበጀ',
    en: 'Tailored for Ethiopian Business'
  },
  formDescription: {
    am: 'መደብርዎን ለመመዝገብ እና እቃዎችን በብቃት ለማስተዳደር ይጀምሩ',
    en: 'Start registering your store and managing inventory efficiently'
  },
  fullName: {
    am: 'ሙሉ ስም',
    en: 'Full Name'
  },
  fullNamePlaceholder: {
    am: 'አበበ በቀለ',
    en: 'Abebe Bekele'
  },
  username: {
    am: 'የተጠቃሚ ስም',
    en: 'Username'
  },
  usernamePlaceholder: {
    am: 'username',
    en: 'username'
  },
  emailPlaceholder: {
    am: 'name@company.com',
    en: 'name@company.com'
  },
  phone: {
    am: 'ስልክ ቁጥር (አማራጭ)',
    en: 'Phone Number (Optional)'
  },
  phonePlaceholder: {
    am: '+251 911 234 567',
    en: '+251 911 234 567'
  },
  passwordHint: {
    am: 'ቢያንስ 6 ቁምፊዎች',
    en: 'At least 6 characters'
  },

  agreeTerms: {
    am: 'የአገልግሎት ውል እና የግላዊነት መመሪያዎችን ተቀበልኩ',
    en: 'I agree to the Terms of Service and Privacy Policy'
  },
  haveAccount: {
    am: 'ቀድሞውንም መለያ አለዎት?',
    en: 'Already have an account?'
  },
  footerTerms: {
    am: 'በመመዝገብ፣ የአገልግሎት ውል እና የግላዊነት መመሪያዎችን ተቀብለዋል',
    en: 'By registering, you agree to our Terms of Service and Privacy Policy'
  },

},



// Add to your translations object
sales: {
  saleDetails: {
    am: 'የሽያጭ ዝርዝሮች',
    en: 'Sale Details'
  },
  saleCode: {
    am: 'ሽያጭ ኮድ',
    en: 'Sale Code'
  },
  receipt: {
    am: 'ሽያጭ ደረሰኝ',
    en: 'Sales Receipt'
  },
  customerInfo: {
    am: 'የደንበኛ መረጃ',
    en: 'Customer Information'
  },
  cashier: {
    am: 'የሸጠው ሰው',
    en: 'Cashier'
  },
  items: {
    am: 'ምርቶች',
    en: 'Items'
  },
  each: {
    am: 'እያንዳንዱ',
    en: 'each'
  },
  paymentSummary: {
    am: 'የክፍያ ማጠቃለያ',
    en: 'Payment Summary'
  },
  total: {
    am: 'አጠቃላይ',
    en: 'Total'
  },
  discount: {
    am: 'ቅናሽ',
    en: 'Discount'
  },
  grandTotal: {
    am: 'ድምር ደምር',
    en: 'Grand Total'
  },
  paymentStatus: {
    am: 'የክፍያ ሁኔታ',
    en: 'Payment Status'
  },
  paid: {
    am: 'ተከፍሏል',
    en: 'Paid'
  },
  partial: {
    am: 'በከፊል ተከፍሏል',
    en: 'Partially Paid'
  },
  pending: {
    am: 'አልተከፈለም',
    en: 'Unpaid'
  },
  cash: {
    am: 'ጥሬ ገንዘብ',
    en: 'Cash'
  },
  card: {
    am: 'ካርድ',
    en: 'Card'
  },
  transfer: {
    am: 'ዝውውር',
    en: 'Transfer'
  },
  notes: {
    am: 'ማስታወሻ',
    en: 'Notes'
  },
  saleOptions: {
    am: 'የሽያጭ አማራጮች',
    en: 'Sale Options'
  },

  item: {
    am: 'እቃ',
    en: 'item'
  },

  totalSales: {
    am: 'አጠቃላይ ሽያጭ',
    en: 'Total Sales'
  },
  totalProfit: {
    am: 'አጠቃላይ ትርፍ',
    en: 'Total Profit'
  },
  averageSale: {
    am: 'አማካይ ሽያጭ',
    en: 'Average Sale'
  },
  searchSale: {
    am: 'ሽያጭ ፈልግ...',
    en: 'Search sale...'
  },
  salesFound: {
    am: 'ሽያጮች ተገኝተዋል',
    en: 'sales found'
  },
  noSales: {
    am: 'ምንም ሽያጮች አልተገኙም',
    en: 'No sales found'
  },
  receiptComingSoon: {
    am: 'የደረሰኝ አትም በሂደት ላይ',
    en: 'Receipt printing coming soon'
  },
  profit: {
    am: 'ትርፍ',
    en: 'Profit'
  },
  printReceipt: {
    am: 'ደረሰኝ አትም',
    en: 'Print Receipt'
  },
  recordPayment: {
    am: 'ክፍያ መዝግብ',
    en: 'Record Payment'
  },
  deleteSale: {
    am: 'ሽያጭ ሰርዝ',
    en: 'Delete Sale'
  },
  deleteConfirm: {
    am: 'ይህን ሽያጭ መሰረዝ ይፈልጋሉ? ይህ ድርጊት ሊቀለበስ አይችልም።',
    en: 'Are you sure you want to delete this sale? This action cannot be undone.'
  },
  saleDeleted: {
    am: 'ሽያጭ በተሳካ ሁኔታ ተሰርዟል',
    en: 'Sale deleted successfully'
  },
  saleDeleteFailed: {
    am: 'ሽያጭ መሰረዝ አልተሳካም',
    en: 'Failed to delete sale'
  },
  saleNotFound: {
    am: 'ሽያጭ አልተገኘም',
    en: 'Sale not found'
  },
  saleFetchFailed: {
    am: 'የሽያጭ ዝርዝሮችን ማምጣት አልተሳካም',
    en: 'Failed to fetch sale details'
  },
newSale: {
    am: 'አዲስ ሽያጭ',
    en: 'New Sale'
  },
  walkInCustomer: {
    am: 'ድንገተኛ ደንበኛ',
    en: 'Walk-in Customer'
  },
  validQuantity: {
    am: 'ትክክለኛ ብዛት ያስገቡ',
    en: 'Enter a valid quantity'
  },
  selectProduct: {
    am: 'ቢያንስ አንድ ምርት ይምረጡ',
    en: 'Select at least one product'
  },
  saleSaved: {
    am: 'ሽያጭ በተሳካ ሁኔታ ተመዝግቧል',
    en: 'Sale saved successfully'
  },
  goToSales: {
    am: 'ወደ ሽያጮች ይሂዱ',
    en: 'Go to Sales'
  },
  viewReceipt: {
    am: 'ደረሰኝ እይ',
    en: 'View Receipt'
  },
  saleSaveFailed: {
    am: 'ሽያጭ መመዝገብ አልተሳካም',
    en: 'Failed to save sale'
  },
  addItems: {
    am: 'ምርቶችን ይጨምሩ',
    en: 'Add Items'
  },
  pressButton: {
    am: 'ከታች ያለውን ቁልፍ ተጫን',
    en: 'Press the button below'
  },
  price: {
    am: 'ዋጋ',
    en: 'Price'
  },
  addMore: {
    am: 'ተጨማሪ ምርት ጨምር',
    en: 'Add More Items'
  },
  customerName: {
    am: 'የደንበኛ ስም',
    en: 'Customer Name'
  },
  phone: {
    am: 'ስልክ ቁጥር',
    en: 'Phone Number'
  },
  payment: {
    am: 'ክፍያ',
    en: 'Payment'
  },
  subtotal: {
    am: 'አጠቃላይ መጠን',
    en: 'Subtotal'
  },
  unpaid: {
    am: 'አልተከፈለም',
    en: 'Unpaid'
  },
  paymentMethod: {
    am: 'የክፍያ ዘዴ',
    en: 'Payment Method'
  },
  notesPlaceholder: {
    am: 'ማስታወሻ ያስገቡ...',
    en: 'Enter notes...'
  },
  saveSale: {
    am: 'ሽያጩን አስቀምጥ',
    en: 'Save Sale'
  },
  searchProduct: {
    am: 'ምርት ፈልግ...',
    en: 'Search product...'
  },
  stock: {
    am: 'ቀሪ',
    en: 'Stock'
  },
tryAgain: {
    am: 'እባክዎ እንደገና ይሞክሩ',
    en: 'Please try again'
  },
noIdProvided: {
    am: 'ምንም መለያ ቁጥር አልተገኘም',
    en: 'No ID provided'
  },
  noItems: {
    am: 'ምርቶች የሉም',
    en: 'No items'
  },
  product: {
    am: 'ምርት',
    en: 'Product'
  },
  retry: {
    am: 'እንደገና ሞክር',
    en: 'Retry'
  },
  noData: {
    am: 'ምንም ውሂብ የለም',
    en: 'No data'
  },
  governmentTax: {
    am: 'የመንግስት ግብር',
    en: 'Government Tax'
  },
  taxAmount: {
    am: 'የግብር መጠን',
    en: 'Tax Amount'
  },
  on: {
    am: 'በርቷል',
    en: 'On'
  },
  off: {
    am: 'ጠፍቷል',
    en: 'Off'
  },
  churchDonation: {
    am: 'አስራት በኩራት  - ክርስቲያን ከሆንክ ከተጣራ ገቢህ ላይ 10% ለቤተ ክርስቲያን አስራት በመስጠት የበረከት ተካፋይ መሆን ይችላሉ።',
    en: 'Tithe with pride: one-tenth of your profit for the church. if your a chirstian you can dedicate this 10% for the church as a tithe or offering.'
  },
  donationAmount: {
    am: 'የልገሳ መጠን',
    en: 'Donation Amount'
  },
  profitAfterTax: {
    am: 'በቫት በኋላ ትርፍ',
    en: 'Profit After VAT'
  },
  netProfit: {
    am: 'የመጨረሻ ትርፍ',
    en: 'Net Profit'
  },
  phoneEmailMinLength: {
    am: 'ስልክ ወይም ኢሜይል ቢያንስ 10 ቁምፊ ይሁን',
    en: 'Phone or Email must be at least 10 characters.'
  },


  zakat: {
    am: 'ዘካ - በኢስላም ሃይማኖታዊ ግዴታ  ከባለጸጋዎች ተወስዶ ለድሆች እና ለተቸገሩ የሚሰጥ የገንዘብ አስተዳደር ነው። 2.5% ለዘካ መስጠት ይችላሉ።',
    en: 'if you are a Muslim you can dedicate this 2.5% for Zakat, which is a form of almsgiving treated in Islam as a religious obligation or tax.'
  },

},






// Add profile section
profile: {
  profileLoadFailed: {
    am: 'የተጠቃሚ መረጃ መጫን አልተቻለም',
    en: 'Failed to load user profile'
  },
  profileUpdated: {
    am: 'መረጃዎ ተሻሽሏል',
    en: 'Your information has been updated'
  },
  profileUpdateFailed: {
    am: 'መረጃ ማሻሻል አልተቻለም',
    en: 'Failed to update information'
  },
  passwordLength: {
    am: 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት',
    en: 'Password must be at least 6 characters'
  },
  passwordMismatch: {
    am: 'የይለፍ ቃላት አይዛመዱም',
    en: 'Passwords do not match'
  },
  passwordChanged: {
    am: 'የይለፍ ቃልዎ ተቀይሯል',
    en: 'Your password has been changed'
  },
  passwordChangeFailed: {
    am: 'የይለፍ ቃል መቀየር አልተቻለም',
    en: 'Failed to change password'
  },
  logout: {
    am: 'ዘግተህ ውጣ',
    en: 'Logout'
  },
  logoutConfirm: {
    am: 'መውጣት እንደምትፈልግ እርግጠኛ ነህ?',
    en: 'Are you sure you want to logout?'
  },
  logoutFailed: {
    am: 'ዘግተህ መውጣት አልተሳካም',
    en: 'Failed to logout'
  },
  contactUs: {
    am: 'ያግኙን',
    en: 'Contact Us'
  },
  contactMessage: {
    am: 'እንዴት ልንረዳዎ እንችላለን?',
    en: 'How can we help you?'
  },
  shareMessage: {
    am: 'አውቶፓርትስ ፕሮ - የእቃ ክምችት አስተዳደር አፕሊኬሽን\nአሁኑኑ ያውርዱ!',
    en: 'AutoParts Pro - Inventory Management App\nDownload now!'
  },
  userNotFound: {
    am: 'የተጠቃሚ መረጃ አልተገኘም',
    en: 'User information not found'
  },
  personalInfo: {
    am: 'የግል መረጃ',
    en: 'Personal Information'
  },
  fullName: {
    am: 'ሙሉ ስም',
    en: 'Full Name'
  },
  username: {
    am: 'የተጠቃሚ ስም',
    en: 'Username'
  },
  notRegistered: {
    am: 'አልተመዘገበም',
    en: 'Not registered'
  },
  joinedDate: {
    am: 'የተቀላቀሉበት ቀን',
    en: 'Joined Date'
  },
  lastLogin: {
    am: 'መጨረሻ ግባት',
    en: 'Last Login'
  },
  synced: {
    am: 'የተመሳሰለ',
    en: 'Synced'
  },
  syncing: {
    am: 'በማመሳሰል ላይ',
    en: 'Syncing'
  },
  aboutUs: {
    am: 'ስለ እኛ',
    en: 'About Us'
  },
  aboutText: {
    am: 'አውቶፓርትስ ፕሮ የእቃ ክምችት አስተዳደር ሲስተም ነው። ንግድዎን በቀላሉ ለማስተዳደር፣ ምርቶችን ለመቆጣጠር እና ሽያጮችን ለመከታተል የተዘጋጀ ነው።',
    en: 'AutoParts Pro is an inventory management system. It is designed to easily manage your business, track products, and monitor sales.'
  },
  version: {
    am: 'ስሪት',
    en: 'Version'
  },
  accountSettings: {
    am: 'የመለያ ቅንብሮች',
    en: 'Account Settings'
  },
  changePassword: {
    am: 'የይለፍ ቃል ቀይር',
    en: 'Change Password'
  },
  contactSupport: {
    am: 'ያግኙን',
    en: 'Contact & Support'
  },
  editInfo: {
    am: 'መረጃ አርትዕ',
    en: 'Edit Information'
  },
  currentPassword: {
    am: 'የአሁኑ የይለፍ ቃል',
    en: 'Current Password'
  },
  newPassword: {
    am: 'አዲስ የይለፍ ቃል',
    en: 'New Password'
  },
  confirmPassword: {
    am: 'አዲስ የይለፍ ቃል ድገም',
    en: 'Confirm New Password'
  },
},






// Add products section
products: {
  productOptions: {
    am: 'የምርት አማራጮች',
    en: 'Product Options'
  },
  duplicate: {
    am: 'ቅዳ',
    en: 'Duplicate'
  },
  deleteProduct: {
    am: 'ምርት ሰርዝ',
    en: 'Delete Product'
  },
  deleteConfirm: {
    am: 'ይህን ምርት መሰረዝ እንደምትፈልግ እርግጠኛ ነህ? ይህ ድርጊት ሊቀለበስ አይችልም።',
    en: 'Are you sure you want to delete this product? This action cannot be undone.'
  },
  productDeleted: {
    am: 'ምርት በተሳካ ሁኔታ ተሰርዟል',
    en: 'Product deleted successfully'
  },
  deleteFailed: {
    am: 'ምርት መሰረዝ አልተሳካም',
    en: 'Failed to delete product'
  },
  searchProduct: {
    am: 'ምርት ፈልግ...',
    en: 'Search product...'
  },
  totalProducts: {
    am: 'አጠቃላይ ምርቶች',
    en: 'Total Products'
  },
  totalStock: {
    am: 'አጠቃላይ ክምችት',
    en: 'Total Stock'
  },
  activeProducts: {
    am: 'ንቁ ምርቶች',
    en: 'Active Products'
  },
  totalValue: {
    am: 'አጠቃላይ ዋጋ',
    en: 'Total Value'
  },
  productsFound: {
    am: 'ምርቶች ተገኝተዋል',
    en: 'products found'
  },
},



inventory: {
  inventoryManagement: {
    am: 'ክምችት አስተዳደር',
    en: 'Inventory Management'
  },
  totalStock: {
    am: 'አጠቃላይ ክምችት',
    en: 'Total Stock'
  },
  lowStock: {
    am: 'ዝቅተኛ ክምችት',
    en: 'Low Stock'
  },
  outOfStock: {
    am: 'ያለቀ',
    en: 'Out of Stock'
  },
  totalValue: {
    am: 'አጠቃላይ ዋጋ',
    en: 'Total Value'
  },
  searchProduct: {
    am: 'ምርት ፈልግ...',
    en: 'Search product...'
  },
  selectCategory: {
    am: 'ምድብ ይምረጡ',
    en: 'Select category'
  },
  noInactiveProducts: {
    am: 'ምንም የታገዱ ምርቶች የሉም',
    en: 'No inactive products found'
  },
  productsFound: {
    am: 'ምርቶች ተገኝተዋል',
    en: 'products found'
  },
},













  // Product Detail
  productDetail: {
    title: {
      am: 'የምርት ዝርዝሮች',
      en: 'Product Details'
    },
    notFound: {
      am: 'ምርት አልተገኘም',
      en: 'Product not found'
    },
    categoryBrand: {
      am: 'ምድብ እና ብራንድ',
      en: 'Category & Brand'
    },
    currentStock: {
      am: 'የአሁኑ ክምችት',
      en: 'Current Stock'
    },
    prices: {
      am: 'ዋጋዎች',
      en: 'Prices'
    }
  },
  expenses: {
    title: {
      am: 'ወጪዎች',
      en: 'Add Expenses'
    },
    addExpense: {
      am: 'ወጪ ጨምር',
      en: 'Add Expense'
    },
    editExpense: {
      am: 'ወጪ አርትዕ',
      en: 'Edit Expense'
    },
    totalExpenses: {
      am: 'ጠቅላላ ወጪዎች',
      en: 'Total Expenses'
    },
    expenseCategory: {
      am: 'የወጪ ምድብ',
      en: 'Expense Category'
    },
    expenseDescription: {
      am: 'የወጪ መግለጫ',
      en: 'Expense Description'
    },
    expenseDate: {
      am: 'የወጪ ቀን',
      en: 'Expense Date'
    },
    deleteConfirmTitle: {
      am: 'ወጪ ሰርዝ?',
      en: 'Delete Expense?'
    },
    deleteConfirmMessage: {
      am: 'ይህንን የወጪ መዝገብ መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?',
      en: 'Are you sure you want to delete this expense record?'
    },
    rent: {
      am: 'ቤት ኪራይ',
      en: 'Rent'
    },
    utilities: {
      am: 'መገልገያዎች',
      en: 'Utilities'
    },
    salaries: {
      am: 'ደመወዝ',
      en: 'Salaries'
    },
    marketing: {
      am: 'ማስተዋወቂያ',
      en: 'Marketing'
    },
    other: {
      am: 'ሌሎች',
      en: 'Other'
    }
  },
  subscription: {
    status: {
      am: 'የደንበኝነት ሁኔታ',
      en: 'Subscription Status'
    },
    plan: {
      am: 'ፕላን',
      en: 'Plan'
    },
    expires: {
      am: 'የሚያበቃበት ቀን',
      en: 'Expires'
    },
    active: {
      am: 'ንቁ',
      en: 'Active'
    },
    expired: {
      am: 'ጊዜው አልቋል',
      en: 'Expired'
    },
    trial: {
      am: 'የሙከራ ጊዜ',
      en: 'Trial'
    },
    locked: {
      am: 'የታገደ',
      en: 'Locked'
    },
    restrictedTitle: {
      am: 'መለያዎ ተገድቧል',
      en: 'Account Restricted'
    },
    restrictedMessage: {
      am: 'እባክዎ መተግበሪያውን መጠቀሙን ለመቀጠል የደንበኝነት ምዝገባዎን ያድሱ።',
      en: 'Please renew your subscription to continue using the application features.'
    },
    contactAdmin: {
      am: 'አስተዳዳሪን ያነጋግሩ',
      en: 'Contact Admin'
    },
    availablePlans: {
      am: 'የሚገኙ ፕላኖች',
      en: 'Available Plans'
    },
    activationInstructions: {
      am: 'የማግበሪያ መመሪያዎች',
      en: 'Activation Instructions'
    },
    priceOnRequest: {
      am: 'አስተዳዳሪን ይጠይቁ',
      en: 'Contact Admin for Price'
    },
    loadingPlans: {
      am: 'የደንበኝነት ፕላኖች በመጫን ላይ...',
      en: 'Loading subscription plans...'
    },
    noPlans: {
      am: 'የደንበኝነት ፕላኖች አልተገኙም።',
      en: 'No subscription plans available.'
    },
    refresh: {
      am: 'አድስ',
      en: 'Refresh'
    },
    subscription: {
      am: 'የደንበኝነት',
      en: 'subscription'
    },
    billedAccordingly: {
      am: 'በተለመደው መልክ ይለጠራል',
      en: 'billed accordingly'
    },
    payAndSendReceipt: {
      am: 'ክፍያ አድርገው የክፍያ ደረሰኝ ላክ',
      en: 'Pay & Send Receipt'
    },
    telegramMessageNote: {
      am: 'ክሊክ አድርገው → ተሌግራም በቅድሚያ የተሞላ መልክ ይከፈታል። ክፍያ ከሰራ በኋላ ደረሰኝ ያያይዙ።',
      en: 'Click → Telegram opens with pre‑filled message. Attach screenshot after payment.'
    },
    accessRestricted: {
      am: 'መለያ ተገድቧል',
      en: 'Access Restricted'
    },
    upgradeEnterprise: {
      am: 'ኢንተርፕራይዝዎን ያሳድጉ',
      en: 'Upgrade Your Enterprise'
    },
    trialEnded: {
      am: 'የተለመደው የሙከራ ጊዜ አልቋል። በደንበኝነት አስተያየት የክምችት ባህሪያትን ይክፈቱ።',
      en: 'Your free trial has ended. Unlock powerful inventory features with a subscription.'
    },
    subscriptionExpired: {
      am: 'ያለፈው የደንበኝነት ጊዜ አልቋል። አሁን ያድሱ እና ሳይጨነቁ መጠቀሞን ይቀጥሉ።',
      en: 'Your previous subscription expired. Renew now to continue seamless management.'
    },
    accountLocked: {
      am: 'መለያ በአሁኑ ጊዜ ተገድቧል። ሙሉ መለያ ለማግኘት ከታች ፕላን ይምረጡ።',
      en: 'Account is currently locked. Choose a plan below to regain full access.'
    },
    accountActive: {
      am: 'መለያዎ ንቁ ነው፣ ግን ቀድሞ ለማሳደግ እና የፕሪሚየም መሳሪያዎችን ለመክፈት ቀድሞ ለማሳደግ ይችላሉ።',
      en: 'Your account is active, but you can upgrade early to secure your business growth and unlock premium tools.'
    },
    paymentActivation: {
      am: 'ክፍያ እና ማግበሪያ እንዴት እንደሚሰራ',
      en: 'How to complete payment & get activated'
    },
    choosePlan: {
      am: 'ፕላንዎን ይምረጡ ({prices} ብር) እና "ክፍያ አድርገው የክፍያ ደረሰኙን በቴሌግራም ይላኩ" የሚለውን ክሊክ አድርጉ።',
      en: 'Choose your plan ({prices} ETB) and click "Pay & Send Receipt".'
    },
    makePayment: {
      am: 'በተሌብር ወይም ባንክ ማስተላለፍ ክፍያ ይክፈሉ (በተሌግራም ደረሰኙን ያያይዙ)።',
      en: 'Make payment via Telebirr or bank transfer (details provided by admin in Telegram).'
    },
    sendReceipt: {
      am: 'የክፍያ ደረሰኝ + የተሌግራም ስምዎ @{username} ወደ @{telegram} ወይም የተመዘገቡበትን Email ይላኩ። ይህ የርሶን አካውንት ለማስቀጠል ይጠቅማል።',
      en: 'Send payment screenshot + your username @{username} to @{telegram} or Email Account. Account activated within minutes.'
    },
    contactTelegram: {
      am: '@{telegram} ን ያነጋግሩ',
      en: 'Contact @{telegram}'
    },
    paymentReminder: {
      am: 'ከ ክፍያ  በኋላ፣ የክፍያ ደረሰኝ ለማሳየት እና  የተሌግራም ስምዎ ወይም ትክክለኛ ስም @{username} ወይም ኢሜል አድራሻ በ ቴሌግራም ይላኩ።',
      en: 'After payment, don\'t forget to attach receipt and include your Telegram username or the exact username @{username} in the message.'
    },
    manualVerification: {
      am: 'በ ማንዋል ማረጋገጫ ፈጣን ነው። የክፍያ ደረሰኝ ከተረጋገጠ በኋላ የድጋፍ ቡድናችን የደንበኝነትዎን አገልግሎት በፍጥነት ያሳድጋሉ።',
      en: 'Manual verification is fast. Our support team will upgrade your subscription instantly once receipt is confirmed.'
    },
    featureLocked: {
      am: 'ባህሪ ተገድቧል',
      en: 'Feature Locked'
    },
    featureLockedMessage: {
      am: 'የ {feature} ባህሪን መጠቀም ለመቀጠል የደንበኝነት ምዝገባዎን ያሳድጉ።',
      en: 'Upgrade your subscription to continue using the {feature} feature.'
    },
    upgradeOptions: {
      am: 'የማሳደግ አማራጮች',
      en: 'Upgrade Options'
    },
    upgradeNow: {
      am: 'አሁን ያሳድጉ',
      en: 'Upgrade Now'
    },
    contactForPayment: {
      am: 'ክፍያ ለማድረግ ያነጋግሩ',
      en: 'Contact for Payment'
    },
    openTelegramChat: {
      am: 'የተሌግራም ውይይት ክፈት',
      en: 'Open Telegram Chat'
    },
    openTelegramChat: {
      am: 'የተሌግራም ውይይት ክፈት',
      en: 'Open Telegram Chat'
    },
    footerText: {
      am: '© {year} ስፔሲፊክ ኢትዮጵያ — የክምችት አስተያየት ሲስተም። ሁሉም መብቶች የተያዙ ናቸው።',
      en: '© {year} Specific Ethiopia — Inventory Management System. All rights reserved.'
    },
    needHelp: {
      am: 'እገዛ ያስፈልጋል? በተሌግራም ቀጥታ መልክ ላክ: @{telegram}',
      en: 'Need help? Direct message on Telegram: @{telegram}'
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, section?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('am');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('appLanguage');
      if (savedLanguage === 'am' || savedLanguage === 'en') {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  // Translation function
  const t = (key: string, section: string = 'common'): string => {
    try {
      // Check if the translations object has the section
      if (translations[section]) {
        // Check if the section has the key
        if (translations[section][key]) {
          return translations[section][key][language] || key;
        }
      }
      
      // If not found, try to find it in common section
      if (translations.common && translations.common[key]) {
        return translations.common[key][language] || key;
      }
      
      // Return the key if no translation found
      return key;
    } catch (error) {
      console.log('Translation error:', error);
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};