import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../styles/theme';

const { height, width } = Dimensions.get('window');

const TermsAndConditions = ({ visible, onClose, onAccept }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconContainer}>
                            <Icon name="file-contract" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.title}>Terms of Service</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Icon name="times" size={20} color="#718096" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        <Text style={styles.lastUpdated}>Last Updated: Feb 2026</Text>

                        <Text style={styles.introText}>
                            Welcome to AURUM. Please read these terms carefully. They govern your use of our platform and ensure a secure environment for all.
                        </Text>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>1. Your Responsibilities</Text>
                            <View style={styles.card}>
                                <Text style={styles.cardText}>
                                    You are responsible for maintaining the confidentiality of your account. Any activity under your account is your liability.
                                </Text>
                                <View style={styles.bulletPoint}>
                                    <Icon name="check" size={12} color={COLORS.primary} style={{ marginTop: 4, marginRight: 8 }} />
                                    <Text style={styles.bulletText}>Notify us immediately of unauthorized access.</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>2. Risk & Liability</Text>
                            <View style={[styles.card, styles.warningCard]}>
                                <View style={styles.warningHeader}>
                                    <Icon name="exclamation-triangle" size={16} color="#C53030" />
                                    <Text style={styles.warningTitle}>Important Disclaimer</Text>
                                </View>
                                <Text style={styles.warningText}>
                                    AURUM is a platform facilitator. We are <Text style={{ fontWeight: '700' }}>NOT</Text> liable for financial losses, fraud, or disputes arising from transactions.
                                </Text>
                                <Text style={[styles.warningText, { marginTop: 8 }]}>
                                    ALWAYS verify details independently before proceeding.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>3. Agreement</Text>
                            <Text style={styles.text}>
                                By using this app, you agree to these terms. Non-compliance may result in account suspension.
                            </Text>
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.acceptButton} onPress={onAccept || onClose} activeOpacity={0.8}>
                            <Text style={styles.acceptButtonText}>I Read and Accept</Text>
                            <Icon name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: '100%',
        maxHeight: height * 0.8,
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F7FAFC'
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(214, 158, 46, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A202C',
        flex: 1
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F7FAFC',
        borderRadius: 20
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    lastUpdated: {
        fontSize: 12,
        color: '#A0AEC0',
        marginBottom: 16,
        textAlign: 'right'
    },
    introText: {
        fontSize: 15,
        color: '#4A5568',
        lineHeight: 24,
        marginBottom: 24
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 12,
        letterSpacing: 0.3
    },
    card: {
        backgroundColor: '#F7FAFC',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EDF2F7'
    },
    cardText: {
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 22,
        marginBottom: 8
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    bulletText: {
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
        flex: 1
    },
    text: {
        fontSize: 14,
        color: '#718096',
        lineHeight: 22
    },
    warningCard: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FEB2B2',
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#C53030',
        marginLeft: 8
    },
    warningText: {
        fontSize: 13,
        color: '#C53030',
        lineHeight: 20
    },
    footer: {
        padding: 24,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F7FAFC'
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5
    }
});

export default TermsAndConditions;
