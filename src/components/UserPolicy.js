
import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../styles/theme';

const UserPolicy = ({ visible, onClose }) => {
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
                        <Text style={styles.title}>User Policy</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="times" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.text}>
                            Your privacy and security are important to us. This policy outlines how we handle your data and your responsibilities as a user.
                        </Text>

                        <Text style={styles.heading}>1. Data Usage</Text>
                        <Text style={styles.text}>
                            We collect basic information to provide our services. We do not sell your personal data to third parties.
                        </Text>

                        <Text style={styles.heading}>2. Platform Liability Disclaimer</Text>
                        <Text style={styles.warningText}>
                            AURUM operates as a facilitator. We explicitly state that user risks and instances of fraud are not the responsibility of our platform. Users engage with merchants and other entities at their own risk. We strongly advise conducting due diligence before any financial transaction.
                        </Text>

                        <Text style={styles.heading}>3. Code of Conduct</Text>
                        <Text style={styles.text}>
                            Users are expected to behave lawfully and respectfully. Harassment, fraud, or misuse of the platform will result in immediate termination of services.
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

export default UserPolicy;
