//app-v0900/src/components/ProjectPDFDocument.tsx

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Project } from '../contexts/AppContext';
import { PDFSettings } from './PDFSettingsModal';
import { formatCurrency, formatDate } from '../lib/utils';

interface ProjectPDFDocumentProps {
  project: Project;
  settings: PDFSettings;
}

const ProjectPDFDocument: React.FC<ProjectPDFDocumentProps> = ({ project, settings }) => {
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 11,
      color: settings.textColor,
      fontFamily: 'Helvetica'
    },
    header: {
      marginBottom: 20,
      paddingBottom: 20,
      borderBottom: `2 solid ${settings.primaryColor}`
    },
    logo: {
      width: 120,
      height: 60,
      marginBottom: 10,
      objectFit: 'contain'
    },
    companyInfo: {
      fontSize: 9,
      color: '#666',
      marginTop: 5
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: settings.primaryColor,
      marginBottom: 10,
      textAlign: 'center'
    },
    orderNumber: {
      fontSize: 16,
      color: settings.secondaryColor,
      textAlign: 'center',
      marginBottom: 20
    },
    section: {
      marginBottom: 15
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: settings.primaryColor,
      marginBottom: 8,
      paddingBottom: 5,
      borderBottom: `1 solid ${settings.secondaryColor}`
    },
    row: {
      flexDirection: 'row',
      marginBottom: 5
    },
    label: {
      width: '40%',
      fontWeight: 'bold',
      fontSize: 10
    },
    value: {
      width: '60%',
      fontSize: 10
    },
    table: {
      marginTop: 10
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: settings.primaryColor,
      padding: 8,
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 10
    },
    tableRow: {
      flexDirection: 'row',
      padding: 8,
      borderBottom: '1 solid #ddd',
      fontSize: 10
    },
    tableCol1: { width: '50%' },
    tableCol2: { width: '25%', textAlign: 'center' },
    tableCol3: { width: '25%', textAlign: 'right' },
    totalSection: {
      marginTop: 20,
      padding: 15,
      backgroundColor: '#f5f5f5',
      borderRadius: 5
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5
    },
    totalLabel: {
      fontSize: 12,
      fontWeight: 'bold'
    },
    totalValue: {
      fontSize: 12,
      fontWeight: 'bold',
      color: settings.primaryColor
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      fontSize: 9,
      color: '#666',
      borderTop: `1 solid ${settings.secondaryColor}`,
      paddingTop: 10
    },
    signature: {
      marginTop: 40,
      paddingTop: 20,
      borderTop: '1 solid #ccc',
      textAlign: 'center',
      fontSize: 10
    },
    notes: {
      marginTop: 15,
      padding: 10,
      backgroundColor: '#fffbf0',
      borderLeft: `3 solid ${settings.secondaryColor}`,
      fontSize: 9
    }
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        {settings.showHeader && (
          <View style={styles.header}>
            {settings.showLogo && settings.companyLogo && (
              <Image src={settings.companyLogo} style={styles.logo} />
            )}
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: settings.primaryColor }}>
              {settings.companyName}
            </Text>
            <Text style={styles.companyInfo}>{settings.companyAddress}</Text>
            <Text style={styles.companyInfo}>
              Tel: {settings.companyPhone} | E-mail: {settings.companyEmail}
            </Text>
          </View>
        )}

        {/* Título */}
        <Text style={styles.title}>{settings.documentTitle}</Text>
        <Text style={styles.orderNumber}>Nº {project.ordernumber}</Text>

        {/* Informações do Cliente */}
        {settings.showClientDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Cliente</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Cliente:</Text>
              <Text style={styles.value}>{project.clientname}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data:</Text>
              <Text style={styles.value}>{formatDate(project.startdate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Prazo de Entrega:</Text>
              <Text style={styles.value}>
                {project.deliverydeadlinedays} dias - até {formatDate(project.enddate)}
              </Text>
            </View>
          </View>
        )}

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição do Projeto</Text>
          <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{project.description}</Text>
        </View>

        {/* Produtos e Serviços */}
        {settings.showProducts && project.products && project.products.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Item</Text>
                <Text style={styles.tableCol2}>Qtd</Text>
                <Text style={styles.tableCol3}>Tipo</Text>
              </View>
              {project.products.map((product, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{product.productname}</Text>
                  <Text style={styles.tableCol2}>{product.quantity}</Text>
                  <Text style={styles.tableCol3}>
                    {product.itemtype === 'produto' ? 'Produto' : 'Serviço'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Valores */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Valor Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(project.budget)}</Text>
          </View>
          {project.paymentterms?.discountpercentage && project.paymentterms.discountpercentage > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={{ fontSize: 10 }}>Desconto ({project.paymentterms.discountpercentage}%):</Text>
                <Text style={{ fontSize: 10, color: 'green' }}>
                  -{formatCurrency((project.budget * project.paymentterms.discountpercentage) / 100)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total com Desconto:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(project.paymentterms.totalwithdiscount || 0)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Condições de Pagamento */}
        {settings.showPaymentTerms && project.paymentterms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condições de Pagamento</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Forma de Pagamento:</Text>
              <Text style={styles.value}>
                {project.paymentterms.installments}x de {formatCurrency(project.paymentterms.installmentvalue || 0)}
              </Text>
            </View>
            {project.paymentterms.paymentmethod && (
              <View style={styles.row}>
                <Text style={styles.label}>Método:</Text>
                <Text style={styles.value}>{project.paymentterms.paymentmethod}</Text>
              </View>
            )}
          </View>
        )}

        {/* Observações */}
        {settings.showNotes && project.notes && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Observações:</Text>
            <Text>{project.notes}</Text>
          </View>
        )}

        {/* Assinatura */}
        {settings.showSignature && (
          <View style={styles.signature}>
            <Text></Text>
            <Text style={{ marginTop: 5 }}>Assinatura do Cliente</Text>
          </View>
        )}

        {/* Mensagem de Agradecimento */}
        {settings.thankYouMessage && (
          <Text style={{ textAlign: 'center', fontSize: 11, marginTop: 20, fontStyle: 'italic' }}>
            {settings.thankYouMessage}
          </Text>
        )}

        {/* Footer */}
        {settings.showFooter && (
          <View style={styles.footer}>
            <Text>{settings.footerText}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ProjectPDFDocument;
