import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PDFSettings {
  watermark: {
    enabled: boolean;
    opacity: number; // 0 a 1
    size: number; // tamanho em pixels
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
  header: {
    companyName: {
      fontSize: number;
      fontWeight: 'normal' | 'bold';
      color: string; // hex color
    };
    backgroundColor: string; // hex color (para compatibilidade)
    gradient: {
      enabled: boolean;
      startColor: string; // hex color
      endColor: string; // hex color
      direction: 'horizontal' | 'vertical' | 'diagonal-right' | 'diagonal-left';
    };
    height: number; // altura do cabeçalho
  };
}

export interface CompanySettings {
  basic: {
    name: string;
    tradeName: string; // Nome fantasia
    email: string;
    website: string;
    phone: string;
    mobile: string;
  };
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  fiscal: {
    cnpj: string;
    ie: string; // Inscrição Estadual
    im: string; // Inscrição Municipal
    taxRegime: 'simplesnacional' | 'lucropresumido' | 'lucroreal' | 'mei';
    icmsContributor: boolean;
    issContributor: boolean;
    pisContributor: boolean;
    cofinsContributor: boolean;
    crt: '1' | '2' | '3'; // Código de Regime Tributário
    cnae: string; // Código CNAE principal
    cnaes: string[]; // CNAEs secundários
  };
  banking: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'corrente' | 'poupanca';
    pix: string;
  };
}

export interface ProductSettings {
  categories: string[];
  units: string[];
  stockAlerts: {
    enabled: boolean;
    threshold: number; // Número de unidades abaixo do estoque mínimo para alertar
    showInDashboard: boolean;
    highlightLowStock: boolean;
    expirationAlerts: boolean; // Para futuras implementações
  };
  automation: {
    autoStockMovement: boolean;
    autoCalculateCosts: boolean;
    defaultProfitMargin: number;
    suggestReorder: boolean;
    suggestAlternatives: boolean;
  };
}

interface SettingsContextType {
  pdfSettings: PDFSettings;
  companySettings: CompanySettings;
  productSettings: ProductSettings;
  updatePDFSettings: (settings: Partial<PDFSettings>) => void;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  updateProductSettings: (settings: Partial<ProductSettings>) => void;
  resetPDFSettings: () => void;
  resetCompanySettings: () => void;
  resetProductSettings: () => void;
}

const defaultPDFSettings: PDFSettings = {
  watermark: {
    enabled: true,
    opacity: 0.08,
    size: 80,
    position: 'center'
  },
  header: {
    companyName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF'
    },
    backgroundColor: '#4682B4',
    gradient: {
      enabled: false,
      startColor: '#4682B4',
      endColor: '#1E40AF',
      direction: 'horizontal'
    },
    height: 35
  }
};

const defaultCompanySettings: CompanySettings = {
  basic: {
    name: 'CARNEVALLI ESQUADRIAS LTDA',
    tradeName: 'Carnevalli Esquadrias',
    email: 'carnevalli.esquadrias@gmail.com',
    website: 'www.carnevalliesquadrias.com.br',
    phone: '(54) 3242-2072',
    mobile: '(54) 99999-9999'
  },
  address: {
    street: 'BUARQUE DE MACEDO',
    number: '2735',
    complement: 'PAVILHÃO',
    neighborhood: 'CENTRO',
    city: 'Nova Prata',
    state: 'RS',
    zipCode: '95320-000',
    country: 'Brasil'
  },
  fiscal: {
    cnpj: '88.235.288/0001-24',
    ie: '0850011930',
    im: '',
    taxRegime: 'simplesnacional',
    icmsContributor: true,
    issContributor: false,
    pisContributor: false,
    cofinsContributor: false,
    crt: '1',
    cnae: '1622-9/00',
    cnaes: []
  },
  banking: {
    bank: '',
    agency: '',
    account: '',
    accountType: 'corrente',
    pix: ''
  }
};
const defaultProductSettings: ProductSettings = {
  categories: [
    'Painéis', 'Ferragens', 'Madeiras', 'Vernizes', 'Colas', 'Parafusos', 
    'Portas', 'Gavetas', 'Prateleiras', 'Estruturas', 'Acessórios', 'Outros'
  ],
  units: ['UN', 'M', 'M²', 'M³', 'KG', 'L', 'PC', 'CX', 'PCT', 'ML'],
  stockAlerts: {
    enabled: true,
    threshold: 0, // Alertar quando estoque <= estoque mínimo
    showInDashboard: true,
    highlightLowStock: true,
    expirationAlerts: false
  },
  automation: {
    autoStockMovement: true,
    autoCalculateCosts: true,
    defaultProfitMargin: 20,
    suggestReorder: true,
    suggestAlternatives: false
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>(defaultPDFSettings);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [productSettings, setProductSettings] = useState<ProductSettings>(defaultProductSettings);

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pdfSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPdfSettings({ ...defaultPDFSettings, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações do PDF:', error);
      }
    }

    const savedCompanySettings = localStorage.getItem('companySettings');
    if (savedCompanySettings) {
      try {
        const parsed = JSON.parse(savedCompanySettings);
        setCompanySettings({ ...defaultCompanySettings, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações da empresa:', error);
      }
    }

    const savedProductSettings = localStorage.getItem('productSettings');
    if (savedProductSettings) {
      try {
        const parsed = JSON.parse(savedProductSettings);
        setProductSettings({ ...defaultProductSettings, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configurações de produtos:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  useEffect(() => {
    localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings));
  }, [pdfSettings]);

  useEffect(() => {
    localStorage.setItem('companySettings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('productSettings', JSON.stringify(productSettings));
  }, [productSettings]);

  /**
   * Deep merges new PDF settings into the current state.
   * This approach merges nested objects (watermark, header, companyName, gradient) to avoid overwriting entire sub-objects.
   * Caveat: If a nested object is omitted in newSettings, its previous values are preserved; 
   *         if a property is explicitly set to undefined, it will not remove the previous value.
   *         This is not a recursive deep merge for arbitrary depth, only for the known structure.
   */
  const updatePDFSettings = (newSettings: Partial<PDFSettings>) => {
    setPdfSettings(prev => ({
      watermark: {
        ...prev.watermark,
        ...(newSettings.watermark || {})
      },
      header: {
        ...prev.header,
        ...(newSettings.header || {}),
        companyName: {
          ...prev.header.companyName,
          ...(newSettings.header?.companyName || {})
        },
        gradient: {
          ...prev.header.gradient,
          ...(newSettings.header?.gradient || {})
        }
      }
    }));
  };
  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({
      ...prev,
      ...newSettings,
      basic: { ...prev.basic, ...newSettings.basic },
      address: { ...prev.address, ...newSettings.address },
      fiscal: { ...prev.fiscal, ...newSettings.fiscal },
      banking: { ...prev.banking, ...newSettings.banking }
    }));
  };

  const updateProductSettings = (newSettings: Partial<ProductSettings>) => {
    setProductSettings(prev => ({
      ...prev,
      ...newSettings,
      stockAlerts: { ...prev.stockAlerts, ...newSettings.stockAlerts },
      automation: { ...prev.automation, ...newSettings.automation }
    }));
  };

  const resetPDFSettings = () => {
    setPdfSettings(defaultPDFSettings);
    localStorage.removeItem('pdfSettings');
  };

  const resetCompanySettings = () => {
    setCompanySettings(defaultCompanySettings);
    localStorage.removeItem('companySettings');
  };

  const resetProductSettings = () => {
    setProductSettings(defaultProductSettings);
    localStorage.removeItem('productSettings');
  };

  return (
    <SettingsContext.Provider value={{
      pdfSettings,
      companySettings,
      productSettings,
      updatePDFSettings,
      updateCompanySettings,
      updateProductSettings,
      resetPDFSettings,
      resetCompanySettings,
      resetProductSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
