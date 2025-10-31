import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CompanyData } from '../types/company';

interface OrderPDFDocumentProps {
  companyData: CompanyData | null;
  orderData: any; // Substitua 'any' pelo seu tipo de pedido
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
    paddingBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  companyInfo: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    paddingBottom: 5,
  },
  text: {
    fontSize: 10,
    color: '#333',
    marginBottom: 4,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  tableRow: {
    display: 'table-row',
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  tableCellHeader: {
    padding: 8,
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#F5F5F5',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#F5F5F5',
    border: '1px solid #DDD',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export function OrderPDFDocument({ companyData, orderData }: OrderPDFDocumentProps) {
  if (!companyData) {
    return null;
  }

  // Renderizar header com logo (se existir) ou sem
  const renderHeader = () => {
    if (companyData.logoUrl) {
      return (
        <View style={styles.header}>
          <Image
            source={companyData.logoUrl}
            style={styles.logo}
            onError={() => {
              console.warn('Erro ao carregar logo, usando fallback');
            }}
          />
          <View style={styles.companyInfo}>
            <Text style={styles.title}>{companyData.nomeFantasia}</Text>
            <Text style={styles.subtitle}>{companyData.razaoSocial}</Text>
            <Text style={styles.subtitle}>CNPJ: {companyData.cnpj}</Text>
            <Text style={styles.subtitle}>
              {companyData.endereco}, {companyData.numero}
              {companyData.complemento ? ` - ${companyData.complemento}` : ''}
            </Text>
            <Text style={styles.subtitle}>
              {companyData.bairro} - CEP: {companyData.cep}
            </Text>
            <Text style={styles.subtitle}>
              Tel: {companyData.foneComercial} | Email: {companyData.email}
            </Text>
          </View>
        </View>
      );
    } else {
      // Sem logo
      return (
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.title}>{companyData.nomeFantasia}</Text>
            <Text style={styles.subtitle}>{companyData.razaoSocial}</Text>
            <Text style={styles.subtitle}>CNPJ: {companyData.cnpj}</Text>
            <Text style={styles.subtitle}>
              {companyData.endereco}, {companyData.numero}
              {companyData.complemento ? ` - ${companyData.complemento}` : ''}
            </Text>
            <Text style={styles.subtitle}>
              {companyData.bairro} - CEP: {companyData.cep}
            </Text>
            <Text style={styles.subtitle}>
              Tel: {companyData.foneComercial} | Email: {companyData.email}
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {renderHeader()}

        {/* Título do Documento */}
        <View style={{ marginBottom: 30, textAlign: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8B4513' }}>
            {orderData?.type === 'orcamento' ? 'ORÇAMENTO' : 'VENDA'}
          </Text>
        </View>

        {/* Informações do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Pedido</Text>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Nº:</Text> {orderData?.order_number || '-'}
              </Text>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Data:</Text>{' '}
                {new Date(orderData?.start_date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Cliente:</Text> {orderData?.client_name || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.text}>{orderData?.description || '-'}</Text>
        </View>

        {/* Itens do Pedido */}
        {orderData?.products && orderData.products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={[styles.tableCellHeader, { width: '50%' }]}>
                  <Text>Descrição</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: '15%' }]}>
                  <Text>Qtd</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: '17.5%' }]}>
                  <Text>Valor Unit.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: '17.5%' }]}>
                  <Text>Total</Text>
                </View>
              </View>

              {orderData.products.map((product: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: '50%' }]}>
                    <Text>{product.product_name}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '15%' }]}>
                    <Text>{product.quantity}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '17.5%' }]}>
                    <Text>R$ {(product.unit_price || 0).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: '17.5%' }]}>
                    <Text>R$ {((product.quantity || 0) * (product.unit_price || 0)).toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Valores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valores</Text>
          <View style={{ borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 10 }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Valor Total:</Text>
              </Text>
              <Text style={{ ...styles.text, fontWeight: 'bold' }}>
                R$ {(orderData?.budget || 0).toFixed(2)}
              </Text>
            </View>

            {orderData?.payment_terms?.discount_percentage && orderData.payment_terms.discount_percentage > 0 && (
              <>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={styles.text}>
                    <Text style={{ fontWeight: 'bold' }}>Desconto ({orderData.payment_terms.discount_percentage}%):</Text>
                  </Text>
                  <Text style={styles.text}>
                    -R$ {(((orderData.budget || 0) * orderData.payment_terms.discount_percentage) / 100).toFixed(2)}
                  </Text>
                </View>

                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderTopWidth: 1,
                    borderTopColor: '#DDD',
                    paddingTop: 5,
                  }}
                >
                  <Text style={{ ...styles.text, fontWeight: 'bold' }}>Total com Desconto:</Text>
                  <Text style={{ ...styles.text, fontWeight: 'bold', color: '#22C55E' }}>
                    R$ {(orderData.payment_terms.total_with_discount || 0).toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Condições de Pagamento */}
        {orderData?.payment_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condições de Pagamento</Text>
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Parcelas:</Text> {orderData.payment_terms.installments}x
            </Text>
            <Text style={styles.text}>
              <Text style={{ fontWeight: 'bold' }}>Valor por Parcela:</Text> R${' '}
              {(orderData.payment_terms.installment_value || 0).toFixed(2)}
            </Text>
            {orderData.payment_terms.payment_method && (
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Método:</Text> {orderData.payment_terms.payment_method}
              </Text>
            )}
          </View>
        )}

        {/* Observações */}
        {orderData?.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.text}>{orderData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento gerado em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR')}
          </Text>
          <Text>Sistema de Gerenciamento para Marcenaria</Text>
        </View>
      </Page>
    </Document>
  );
}
