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
});

export function OrderPDFDocument({ companyData, orderData }: OrderPDFDocumentProps) {
  if (!companyData) {
    return null;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {companyData.logoUrl && (
            <Image source={companyData.logoUrl} style={styles.logo} />
          )}
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

        {/* Título do Documento */}
        <View style={{ marginBottom: 30, textAlign: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#8B4513' }}>
            {orderData?.tipo === 'orcamento' ? 'ORÇAMENTO' : 'PEDIDO DE VENDA'}
          </Text>
        </View>

        {/* Informações do Pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Pedido</Text>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Nº:</Text> {orderData?.numero || '-'}
              </Text>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Data:</Text> {new Date(orderData?.data).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View>
              <Text style={styles.text}>
                <Text style={{ fontWeight: 'bold' }}>Cliente:</Text> {orderData?.cliente_nome || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabela de Itens (exemplo) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
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
            {/* Aqui você iteraria pelos itens do pedido */}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Documento gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</Text>
        </View>
      </Page>
    </Document>
  );
}

