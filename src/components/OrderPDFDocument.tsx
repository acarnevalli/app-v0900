import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { CompanyData } from '../types/company';

interface OrderPDFDocumentProps {
  companyData: CompanyData | null;
  orderData: any;
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  
  // ========== CABEÇALHO PROFISSIONAL ==========
  header: {
    backgroundColor: '#4682B4',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  headerCompanyInfo: {
    flex: 1,
  },
  headerCompanyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  headerAddress: {
    fontSize: 8,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerContactInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  headerContact: {
    fontSize: 8,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  // ========== TIPO DO DOCUMENTO ==========
  documentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 30,
    marginBottom: 15,
  },
  documentTypeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  documentTypeBadgeQuote: {
    backgroundColor: '#3B82F6',
  },
  documentTypeBadgeSale: {
    backgroundColor: '#22C55E',
  },
  documentTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  documentNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // ========== DADOS DO CLIENTE ==========
  clientSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginHorizontal: 30,
    marginBottom: 15,
    borderRadius: 5,
  },
  clientTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  clientText: {
    fontSize: 10,
    color: '#333',
  },
  
  // ========== DESCRIÇÃO ==========
  descriptionSection: {
    marginHorizontal: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 10,
    color: '#555',
    lineHeight: 1.5,
  },
  
  // ========== TABELA DE PRODUTOS LIMPA ==========
  productsSection: {
    marginHorizontal: 30,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4682B4',
    padding: 8,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  tableCellName: {
    width: '50%',
  },
  tableCellQty: {
    width: '15%',
    textAlign: 'center',
  },
  tableCellPrice: {
    width: '17.5%',
    textAlign: 'right',
  },
  tableCellTotal: {
    width: '17.5%',
    textAlign: 'right',
  },
  
  // ========== TOTAIS DESTACADOS ==========
  totalsSection: {
    marginHorizontal: 30,
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  totalsSeparator: {
    width: 200,
    height: 2,
    backgroundColor: '#4682B4',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 10,
    color: '#333',
  },
  totalFinalContainer: {
    backgroundColor: '#22C55E',
    padding: 8,
    borderRadius: 5,
    width: 200,
    marginTop: 5,
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalFinalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalFinalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // ========== CONDIÇÕES DE PAGAMENTO E ENTREGA ==========
  paymentSection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginHorizontal: 30,
    marginBottom: 10,
    borderRadius: 5,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 10,
    color: '#555',
    marginBottom: 4,
  },
  
  // Tabela de parcelas
  installmentsTable: {
    marginTop: 8,
  },
  installmentTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4682B4',
    padding: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  installmentHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  installmentRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  installmentRowEven: {
    backgroundColor: '#FFFFFF',
  },
  installmentCell: {
    fontSize: 9,
    color: '#333',
  },
  installmentNumber: {
    width: '33%',
  },
  installmentDate: {
    width: '34%',
    textAlign: 'center',
  },
  installmentValue: {
    width: '33%',
    textAlign: 'right',
  },
  
  deliverySection: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    marginHorizontal: 30,
    marginBottom: 10,
    borderRadius: 5,
  },
  
  notesSection: {
    marginHorizontal: 30,
    marginBottom: 15,
  },
  notesText: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.5,
  },
  
  // ========== RODAPÉ ==========
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  footerText: {
    fontSize: 8,
    color: '#999',
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

const paymentMethodLabels: { [key: string]: string } = {
  'dinheiro': 'Dinheiro',
  'pix': 'PIX',
  'cartao_credito': 'Cartão de Crédito',
  'cartao_debito': 'Cartão de Débito',
  'boleto': 'Boleto Bancário',
  'transferencia': 'Transferência Bancária'
};

export function OrderPDFDocument({ companyData, orderData }: OrderPDFDocumentProps) {
  if (!companyData) {
    return null;
  }

  const isQuote = orderData?.type === 'orcamento';
  const documentTitle = isQuote ? 'ORÇAMENTO' : 'VENDA CONCLUÍDA';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ========== CABEÇALHO PROFISSIONAL ========== */}
        <View style={styles.header}>
          {companyData.logoUrl && (
            <Image
              src={companyData.logoUrl}
              style={styles.headerLogo}
              onError={() => console.warn('Erro ao carregar logo')}
            />
          )}
          
          <View style={styles.headerCompanyInfo}>
            <Text style={styles.headerCompanyName}>
              {companyData.nomeFantasia || 'CARNEVALLI ESQUADRIAS LTDA'}
            </Text>
            <Text style={styles.headerAddress}>
              {companyData.endereco}, {companyData.numero}
              {companyData.complemento ? ` - ${companyData.complemento}` : ''}
            </Text>
            <Text style={styles.headerAddress}>
              {companyData.bairro} - {companyData.cidade} - {companyData.estado} - CEP: {companyData.cep}
            </Text>
          </View>
          
          <View style={styles.headerContactInfo}>
            <Text style={styles.headerContact}>
              Tel: {companyData.foneComercial}
            </Text>
            <Text style={styles.headerContact}>
              {companyData.email}
            </Text>
            <Text style={styles.headerContact}>
              CNPJ: {companyData.cnpj}
            </Text>
            {companyData.inscricaoEstadual && (
              <Text style={styles.headerContact}>
                IE: {companyData.inscricaoEstadual}
              </Text>
            )}
          </View>
        </View>

        {/* ========== TIPO DO DOCUMENTO ========== */}
        <View style={styles.documentTypeContainer}>
          <View style={[
            styles.documentTypeBadge,
            isQuote ? styles.documentTypeBadgeQuote : styles.documentTypeBadgeSale
          ]}>
            <Text style={styles.documentTypeText}>{documentTitle}</Text>
          </View>
          
          <Text style={styles.documentNumber}>
            Nº {orderData?.number?.toString().padStart(4, '0') || orderData?.order_number || '-'}
          </Text>
        </View>

        {/* ========== DADOS DO CLIENTE ========== */}
        <View style={styles.clientSection}>
          <Text style={styles.clientTitle}>DADOS DO CLIENTE</Text>
          
          <View style={styles.clientInfo}>
            <Text style={styles.clientText}>
              Cliente: {orderData?.client_name || 'Não identificado'}
            </Text>
            <Text style={styles.clientText}>
              Data de Emissão: {new Date().toLocaleDateString('pt-BR')}
            </Text>
          </View>
          
          <View style={styles.clientInfo}>
            {orderData?.start_date && (
              <Text style={styles.clientText}>
                Início: {new Date(orderData.start_date).toLocaleDateString('pt-BR')}
              </Text>
            )}
            {orderData?.end_date && (
              <Text style={styles.clientText}>
                Prazo: {new Date(orderData.end_date).toLocaleDateString('pt-BR')}
              </Text>
            )}
          </View>
        </View>

        {/* ========== DESCRIÇÃO ========== */}
        {orderData?.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>DESCRIÇÃO</Text>
            <Text style={styles.descriptionText}>{orderData.description}</Text>
          </View>
        )}

        {/* ========== LISTA DE PRODUTOS LIMPA ========== */}
        {orderData?.products && orderData.products.length > 0 && (
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>PRODUTOS E SERVIÇOS</Text>
            
            {/* Cabeçalho da tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCellName]}>Item</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellQty]}>Qtd</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellPrice]}>Valor Unit.</Text>
              <Text style={[styles.tableHeaderText, styles.tableCellTotal]}>Total</Text>
            </View>
            
            {/* Linhas de produtos */}
            {orderData.products.map((product: any, index: number) => (
              <View 
                key={index} 
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : null
                ]}
              >
                <Text style={[styles.tableCell, styles.tableCellName]}>
                  {product.product_name}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellQty]}>
                  {product.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellPrice]}>
                  R$ {(product.unit_price || 0).toFixed(2).replace('.', ',')}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellTotal]}>
                  R$ {(product.total_price || (product.quantity * product.unit_price) || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ========== TOTAIS DESTACADOS ========== */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsSeparator} />
          
          {/* Subtotal */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              R$ {(orderData?.budget || 0).toFixed(2).replace('.', ',')}
            </Text>
          </View>
          
          {/* Desconto (se houver) */}
          {orderData?.payment_terms?.discount_percentage && orderData.payment_terms.discount_percentage > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Desconto ({orderData.payment_terms.discount_percentage}%):
                </Text>
                <Text style={styles.totalValue}>
                  -R$ {(((orderData.budget || 0) * orderData.payment_terms.discount_percentage) / 100).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              
              {/* Total com desconto */}
              <View style={styles.totalFinalContainer}>
                <View style={styles.totalFinalRow}>
                  <Text style={styles.totalFinalLabel}>TOTAL:</Text>
                  <Text style={styles.totalFinalValue}>
                    R$ {(orderData.payment_terms.total_with_discount || 0).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              </View>
            </>
          )}
          
          {/* Total sem desconto */}
          {(!orderData?.payment_terms?.discount_percentage || orderData.payment_terms.discount_percentage === 0) && (
            <View style={styles.totalFinalContainer}>
              <View style={styles.totalFinalRow}>
                <Text style={styles.totalFinalLabel}>TOTAL:</Text>
                <Text style={styles.totalFinalValue}>
                  R$ {(orderData?.budget || 0).toFixed(2).replace('.', ',')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ========== CONDIÇÕES DE PAGAMENTO ========== */}
        {orderData?.payment_terms && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>CONDIÇÕES DE PAGAMENTO</Text>
            
            <Text style={styles.paymentText}>
              Forma de Pagamento: {paymentMethodLabels[orderData.payment_terms.payment_method] || orderData.payment_terms.payment_method}
            </Text>
            
            {/* Parcelas */}
            {orderData.payment_terms.installments > 1 ? (
              <>
                <Text style={styles.paymentText}>
                  Parcelamento: {orderData.payment_terms.installments}x de R$ {(orderData.payment_terms.installment_value || 0).toFixed(2).replace('.', ',')}
                </Text>
                
                {/* Tabela de parcelas */}
                <View style={styles.installmentsTable}>
                  <View style={styles.installmentTableHeader}>
                    <Text style={[styles.installmentHeaderText, styles.installmentNumber]}>Parcela</Text>
                    <Text style={[styles.installmentHeaderText, styles.installmentDate]}>Vencimento</Text>
                    <Text style={[styles.installmentHeaderText, styles.installmentValue]}>Valor</Text>
                  </View>
                  
                  {Array.from({ length: Math.min(orderData.payment_terms.installments, 6) }, (_, i) => {
                    const installmentDate = new Date();
                    installmentDate.setMonth(installmentDate.getMonth() + i);
                    
                    return (
                      <View 
                        key={i} 
                        style={[
                          styles.installmentRow,
                          i % 2 === 0 ? styles.installmentRowEven : null
                        ]}
                      >
                        <Text style={[styles.installmentCell, styles.installmentNumber]}>
                          {i + 1}ª parcela
                        </Text>
                        <Text style={[styles.installmentCell, styles.installmentDate]}>
                          {installmentDate.toLocaleDateString('pt-BR')}
                        </Text>
                        <Text style={[styles.installmentCell, styles.installmentValue]}>
                          R$ {(orderData.payment_terms.installment_value || 0).toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    );
                  })}
                  
                  {orderData.payment_terms.installments > 6 && (
                    <Text style={[styles.paymentText, { marginTop: 4, fontSize: 8, fontStyle: 'italic' }]}>
                      ... e mais {orderData.payment_terms.installments - 6} parcelas
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <Text style={styles.paymentText}>Pagamento à vista</Text>
            )}
          </View>
        )}

        {/* ========== INFORMAÇÕES DE ENTREGA ========== */}
        <View style={styles.deliverySection}>
          <Text style={styles.paymentTitle}>INFORMAÇÕES DE ENTREGA</Text>
          
          {orderData?.delivery_deadline_days && (
            <Text style={styles.paymentText}>
              Prazo de Entrega: {orderData.delivery_deadline_days} dias após aprovação
            </Text>
          )}
          
          {orderData?.end_date && (
            <Text style={styles.paymentText}>
              Data Prevista: {new Date(orderData.end_date).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>

        {/* ========== OBSERVAÇÕES ========== */}
        {orderData?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            <Text style={styles.notesText}>{orderData.notes}</Text>
          </View>
        )}

        {/* ========== RODAPÉ ========== */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              {isQuote 
                ? 'Este orçamento tem validade de 30 dias a partir da data de emissão.' 
                : 'Obrigado pela sua compra!'}
            </Text>
            <Text style={styles.footerText}>
              Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
            </Text>
          </View>
          <Text style={[styles.footerText, { marginTop: 3 }]}>
            Documento gerado automaticamente pelo sistema.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
