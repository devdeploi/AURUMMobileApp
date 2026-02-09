
import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../styles/theme';

const TermsAndConditions = ({ visible, onClose }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Terms and Conditions</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="times" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.text}>
                            Welcome to AURUM. checks and balances are in place to ensure a safe and secure environment for all users.
                        </Text>

                        <Text style={styles.heading}>1. User Responsibility</Text>
                        <Text style={styles.text}>
                            By registering, you acknowledge that you are solely responsible for the confidentiality of your account credentials and for any activity that occurs under your account.
                        </Text>

                        <Text style={styles.heading}>2. Risk & Fraud Disclaimer</Text>
                        <Text style={styles.warningText}>
                            AURUM is a platform provider and is not responsible for any financial loss, fraud, or user risks associated with transactions made on the platform. Users are advised to verify all details before proceeding with any transaction. We do not take liability for third-party actions or unauthorized access resulting from user negligence.
                        </Text>

                        <Text style={styles.heading}>3. Acceptance of Terms</Text>
                        <Text style={styles.text}>
                            By continuing to use this application, you agree to abide by all the terms set forth in this agreement. Failure to comply may result in account suspension or termination.
                        </Text>
                    </ScrollView>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>I Understand</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        maxHeight: '80%',
        width: '100%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary
    },
    content: {
        padding: 20
    },
    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 15,
        marginBottom: 8
    },
    text: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 10
    },
    warningText: {
        fontSize: 14,
        color: '#D32F2F', // Red for warning
        lineHeight: 20,
        marginBottom: 10,
        fontWeight: '500',
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 8
    },
    closeButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        alignItems: 'center',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});

export default TermsAndConditions;
