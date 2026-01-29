/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, TextInput, Image, Alert, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../../styles/theme';
import { APIURL, BASE_URL } from '../../constants/api';
import SkeletonLoader from '../SkeletonLoader';

import CustomAlert from '../CustomAlert';

const AnalyticsTab = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [payingId, setPayingId] = useState(null);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [expandedCardId, setExpandedCardId] = useState(null); // Track which card is expanded
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Offline Payment State
    const [offlineModalVisible, setOfflineModalVisible] = useState(false);
    const [selectedPlanForOffline, setSelectedPlanForOffline] = useState(null);
    const [offlineForm, setOfflineForm] = useState({
        notes: '',
        proofImage: null, // { uri, type, fileName }
        date: new Date(), // Store as Date object
    });
    const [submittingOffline, setSubmittingOffline] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);


    const showAlert = (title, message, type = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig({ ...alertConfig, visible: false });
    };

    const fetchMyPlans = React.useCallback(async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };
            const { data } = await axios.get(`${APIURL}/chit-plans/my-plans`, config);
            setPlans(data);

        } catch (error) {
            console.error('Failed to fetch my plans', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);
    console.log(plans);
    

    useEffect(() => {
        if (user && user.token) {
            fetchMyPlans();
        }
    }, [fetchMyPlans, user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyPlans();
    };

    // --- Offline Payment Handlers ---

    const openOfflineModal = (plan) => {
        setSelectedPlanForOffline(plan);
        setOfflineForm({
            notes: '',
            proofImage: null,
            date: new Date()
        });
        setOfflineModalVisible(true);
    };

    const pickImage = async () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        };

        const result = await launchImageLibrary(options);
        if (result.assets && result.assets.length > 0) {
            setOfflineForm({ ...offlineForm, proofImage: result.assets[0] });
        }
    };

    const submitOfflinePayment = async () => {
        if (!selectedPlanForOffline) return;

        setSubmittingOffline(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data' // Important for file upload
                }
            };

            let proofImageUrl = '';

            // 1. Upload Image if present
            if (offlineForm.proofImage) {
                const formData = new FormData();
                formData.append('image', {
                    uri: offlineForm.proofImage.uri,
                    type: offlineForm.proofImage.type,
                    name: offlineForm.proofImage.fileName || 'proof.jpg',
                });

                try {
                    const uploadRes = await axios.post(`${APIURL}/upload`, formData, config);
                    proofImageUrl = uploadRes.data; // Assuming it returns path string
                } catch (uploadErr) {
                    console.error("Upload failed", uploadErr);
                    Alert.alert("Upload Failed", "Could not upload proof image. Please try again.");
                    setSubmittingOffline(false);
                    return;
                }
            }

            // 2. Submit Request
            const requestBody = {
                chitPlanId: selectedPlanForOffline._id,
                amount: selectedPlanForOffline.monthlyAmount,
                notes: offlineForm.notes,
                proofImage: proofImageUrl,
                date: offlineForm.date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD
            };

            // Reset content type for JSON
            const jsonConfig = {
                headers: { Authorization: `Bearer ${user.token}` }
            };

            await axios.post(`${APIURL}/payments/offline/request`, requestBody, jsonConfig);

            setOfflineModalVisible(false);
            showAlert('Request Sent', 'Your offline payment request has been sent for approval.', 'success');
            fetchMyPlans(); // Refresh to potentially show status? (Not implemented in UI yet but good practice)

        } catch (error) {
            console.error("Offline Request Failed", error);
            Alert.alert("Error", "Failed to submit request.");
        } finally {
            setSubmittingOffline(false);
        }
    };




    const handlePayInstallment = async (plan) => {
        setPayingId(plan._id);
        console.log(plan);

        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` }
            };

            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-installment-order`, {
                amount: plan.monthlyAmount,
                currency: 'INR',
                chitPlanId: plan._id
            }, config);


            // 2. Open Razorpay
            const options = {
                description: `Installment for ${plan.planName}`,
                image: plan.merchant?.shopLogo ? `${BASE_URL}${plan.merchant.shopLogo}` : undefined,
                currency: 'INR',
                key: 'rzp_test_S6RoMCiZCpsLo7', // Replace with valid env key if available
                amount: order.amount,
                name: 'Aurum',
                order_id: order.id,
                prefill: {
                    email: user?.email || '',
                    contact: user?.phone || '',
                    name: user?.name || ''
                },
                theme: { color: COLORS.primary }
            };

            RazorpayCheckout.open(options).then(async (data) => {
                // 3. Verify Payment
                try {
                    await axios.post(`${APIURL}/payments/verify-installment`, {
                        paymentId: data.razorpay_payment_id,
                        orderId: data.razorpay_order_id,
                        signature: data.razorpay_signature,
                        chitPlanId: plan._id
                    }, config);

                    showAlert('Success', 'Installment paid successfully!', 'success');
                    fetchMyPlans(); // Refresh data
                } catch (err) {
                    console.log(err);
                    console.error(err);
                    showAlert('Error', 'Payment verified but update failed. Contact support.', 'error');
                }
            }).catch((error) => {
                console.error(error);
                showAlert('Error', `Payment failed: ${error.description || 'Cancelled'}`, 'error');
            });

        } catch (error) {
            console.error(error);
            showAlert('Error', error.response?.data?.message || 'Failed to initiate payment', 'error');
        } finally {
            setPayingId(null);
        }
    };


    return (
        <View style={styles.wrapper}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.sectionTitle}>My Subscriptions</Text>
                    <Text style={styles.sectionSubtitle}>Track your gold savings progress</Text>
                </View>

                {loading ? (
                    <SkeletonLoader />
                ) : plans.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="box-open" size={40} color={COLORS.secondary} />
                        <Text style={styles.emptyText}>You haven't subscribed to any plans yet.</Text>
                    </View>
                ) : (
                    <View style={styles.plansContainer}>
                        {plans.map((plan) => {
                            let dueDate = null;
                            let isPayable = false;
                            let diffDays = 100; // Default large

                            // Parse Due Date
                            if (plan.nextDueDate) {
                                dueDate = new Date(plan.nextDueDate);
                                const now = new Date();
                                const timeDiff = dueDate.getTime() - now.getTime();
                                diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                // Determine if payable (Only if current month has reached or passed due month)
                                if (plan.status === 'active') {
                                    const currentMonth = now.getMonth();
                                    const currentYear = now.getFullYear();
                                    const dueMonth = dueDate.getMonth();
                                    const dueYear = dueDate.getFullYear();

                                    if (currentYear > dueYear || (currentYear === dueYear && currentMonth >= dueMonth)) {
                                        isPayable = true;
                                    }
                                }
                            }

                            const isExpanded = expandedCardId === plan._id;

                            return (
                                <TouchableOpacity
                                    key={plan._id}
                                    style={styles.planCard}
                                    onPress={() => setExpandedCardId(isExpanded ? null : plan._id)}
                                    activeOpacity={0.7}
                                >
                                    {/* Always Visible Header */}
                                    <View style={styles.planHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.planName}>{plan.planName}</Text>
                                            <View style={styles.merchantRow}>
                                                <Icon name="store" size={10} color={COLORS.secondary} />
                                                <Text style={styles.merchantName}>{plan.merchant?.name}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: plan.status === 'active' ? '#E8F5E9' : '#eee' }]}>
                                            <Text style={[styles.statusText, { color: plan.status === 'active' ? '#2E7D32' : '#666' }]}>
                                                {plan.status ? plan.status.toUpperCase() : 'UNKNOWN'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Compact Progress Bar - Always Visible */}
                                    <View style={styles.compactProgress}>
                                        <View style={styles.progressBarBg}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    { width: `${(plan.installmentsPaid / plan.durationMonths) * 100}%` }
                                                ]}
                                            />
                                        </View>
                                        <View style={styles.compactStats}>
                                            <Text style={styles.compactStatText}>
                                                ₹{plan.totalSaved ? plan.totalSaved.toLocaleString() : 0} saved
                                            </Text>
                                            <Text style={styles.compactStatText}>
                                                {plan.installmentsPaid}/{plan.durationMonths} months
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Expand/Collapse Indicator */}
                                    <View style={styles.expandIndicator}>
                                        <Text style={styles.expandText}>
                                            {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
                                        </Text>
                                        <Icon
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={10}
                                            color={COLORS.primary}
                                        />
                                    </View>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <>
                                            <View style={styles.divider} />

                                            <View style={styles.statsGrid}>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Total Saved</Text>
                                                    <Text style={styles.statValue}>₹{plan.totalSaved ? plan.totalSaved.toLocaleString() : 0}</Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Next Due</Text>
                                                    <Text style={[styles.statValue, diffDays <= 3 && { color: COLORS.error }]}>
                                                        {dueDate && !isNaN(dueDate.getTime())
                                                            ? dueDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
                                                            : 'Due Now'}
                                                    </Text>
                                                </View>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statLabel}>Remaining</Text>
                                                    <Text style={styles.statValue}>{plan.remainingMonths} Months</Text>
                                                </View>
                                            </View>

                                            {/* Payment Buttons */}
                                            <View style={{ gap: 10 }}>
                                                {isPayable && (
                                                    <>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.payButton,
                                                                diffDays <= 3 ? styles.payButtonUrgent : styles.payButtonNormal
                                                            ]}
                                                            onPress={() => handlePayInstallment(plan)}
                                                            disabled={payingId === plan._id}
                                                        >
                                                            {payingId === plan._id ? (
                                                                <ActivityIndicator color="#fff" size="small" />
                                                            ) : (
                                                                <Text style={[
                                                                    styles.payButtonText,
                                                                    diffDays <= 3 ? styles.payButtonTextUrgent : styles.payButtonTextNormal
                                                                ]}>
                                                                    Pay Online: ₹{plan.monthlyAmount} + (2% fee)
                                                                </Text>
                                                            )}
                                                        </TouchableOpacity>

                                                        <TouchableOpacity
                                                            style={[
                                                                styles.outlineButton,
                                                                diffDays <= 3 ? styles.outlineButtonUrgent : styles.outlineButtonNormal
                                                            ]}
                                                            onPress={() => openOfflineModal(plan)}
                                                        >
                                                            <Text style={[
                                                                styles.outlineButtonText,
                                                                diffDays <= 3 ? styles.outlineButtonTextUrgent : styles.outlineButtonTextNormal
                                                            ]}>
                                                                Paid Offline (No Fee)?
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>

                                            {!isPayable && plan.status === 'active' && (
                                                <View style={[styles.footerRow, { marginTop: 10 }]}>
                                                    <Icon name="info-circle" size={12} color={COLORS.secondary} />
                                                    <Text style={[styles.footerText, { color: COLORS.secondary, fontSize: 10 }]}>
                                                        Online payments include a 2% platform fee
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={[styles.footerRow, { marginTop: 10, backgroundColor: '#f8f9fa' }]}>
                                                <Icon name="piggy-bank" size={12} color={COLORS.primary} />
                                                <Text style={styles.footerText}>
                                                    Target Goal: ₹{plan.totalAmount.toLocaleString()}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.historyToggleButton}
                                                onPress={() => setExpandedHistoryId(expandedHistoryId === plan._id ? null : plan._id)}
                                            >
                                                <Text style={styles.historyToggleText}>
                                                    {expandedHistoryId === plan._id ? 'Hide Payment History' : 'View Payment History'}
                                                </Text>
                                                <Icon name={expandedHistoryId === plan._id ? "chevron-up" : "chevron-down"} size={10} color={COLORS.primary} />
                                            </TouchableOpacity>

                                            {expandedHistoryId === plan._id && (
                                                <View style={styles.historyContainer}>
                                                    <Text style={styles.historyTitle}>Payment History</Text>
                                                    {plan.history && plan.history.length > 0 ? (
                                                        plan.history.map((payment, index) => (
                                                            <View key={payment._id || index} style={styles.historyItem}>
                                                                <View style={styles.historyLeft}>
                                                                    <Icon name="check-circle" size={10} color={payment.status === 'Pending Approval' ? 'orange' : "#2E7D32"} style={{ marginTop: 2 }} />
                                                                    <View style={{ marginLeft: 8 }}>
                                                                        <Text style={styles.historyDate}>
                                                                            {new Date(payment.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                        </Text>
                                                                        <Text style={[styles.historyStatus, { color: payment.status === 'Pending Approval' ? 'orange' : '#666' }]}>
                                                                            {payment.status || 'Paid'} {payment.commissionAmount > 0 ? '(Online)' : '(Offline)'}
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                                <View style={{ alignItems: 'flex-end' }}>
                                                                    <Text style={styles.historyAmount}>+ ₹{payment.amount}</Text>
                                                                    {payment.commissionAmount > 0 && (
                                                                        <Text style={{ fontSize: 8, color: COLORS.secondary }}>+ ₹{payment.commissionAmount} fee</Text>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        ))
                                                    ) : (
                                                        <Text style={styles.noHistoryText}>No payments recorded yet.</Text>
                                                    )}
                                                </View>
                                            )}
                                        </>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                <CustomAlert {...alertConfig} onClose={hideAlert} />

                {/* Offline Payment Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={offlineModalVisible}
                    onRequestClose={() => setOfflineModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Report Offline Payment</Text>
                                <TouchableOpacity onPress={() => setOfflineModalVisible(false)}>
                                    <Icon name="times" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                                <Text style={styles.modalSubtitle}>
                                    For Plan: <Text style={{ fontWeight: 'bold' }}>{selectedPlanForOffline?.planName}</Text>
                                </Text>
                                <Text style={styles.modalInfo}>
                                    Ensure you have paid <Text style={{ fontWeight: 'bold' }}>₹{selectedPlanForOffline?.monthlyAmount}</Text> to the merchant directly.
                                </Text>

                                <Text style={styles.inputLabel}>Payment Date</Text>
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Icon name="calendar-alt" size={16} color={COLORS.primary} />
                                    <Text style={styles.datePickerText}>
                                        {offlineForm.date.toLocaleDateString('en-GB', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <DateTimePicker
                                        value={offlineForm.date}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, selectedDate) => {
                                            setShowDatePicker(Platform.OS === 'ios');
                                            if (selectedDate) {
                                                setOfflineForm({ ...offlineForm, date: selectedDate });
                                            }
                                        }}
                                        maximumDate={new Date()}
                                    />
                                )}

                                <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="E.g., Paid via UPI to store owner..."
                                    value={offlineForm.notes}
                                    onChangeText={(t) => setOfflineForm({ ...offlineForm, notes: t })}
                                    multiline
                                />

                                <Text style={styles.inputLabel}>Proof of Payment (Screenshot/Receipt)</Text>
                                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                                    <Icon name="camera" size={20} color={COLORS.primary} />
                                    <Text style={styles.uploadButtonText}>
                                        {offlineForm.proofImage ? 'Change Image' : 'Upload Proof Image'}
                                    </Text>
                                </TouchableOpacity>

                                {offlineForm.proofImage && (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: offlineForm.proofImage.uri }} style={styles.imagePreview} />
                                        <Text style={styles.imageName}>{offlineForm.proofImage.fileName}</Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[styles.submitButton, submittingOffline && { opacity: 0.7 }]}
                                    onPress={submitOfflinePayment}
                                    disabled={submittingOffline}
                                >
                                    {submittingOffline ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Submit Request</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
            <LinearGradient
                colors={['rgba(248, 250, 252, 0)', '#F8FAFC']}
                style={styles.bottomFade}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#F8FAFC' // Match theme
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: COLORS.secondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
    },
    emptyText: {
        marginTop: 15,
        color: COLORS.secondary,
        fontSize: 14,
    },
    planCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    planName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 4,
    },
    merchantRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    merchantName: {
        fontSize: 12,
        color: COLORS.secondary,
        marginLeft: 5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
        backgroundColor: '#fafbfc',
        padding: 12,
        borderRadius: 10,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.secondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 11,
        color: COLORS.secondary,
        fontWeight: '600',
    },
    progressValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    compactProgress: {
        marginTop: 10,
        marginBottom: 8,
    },
    compactStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    compactStatText: {
        fontSize: 10,
        color: COLORS.secondary,
        fontWeight: '600',
    },
    expandIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        paddingVertical: 4,
    },
    expandText: {
        fontSize: 9,
        color: COLORS.primary,
        marginRight: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '08',
        padding: 8,
        borderRadius: 8,
        justifyContent: 'center',
    },
    footerText: {
        marginLeft: 6,
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    payButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    payButtonUrgent: {
        padding: 14,
        shadowOpacity: 0.5,
        elevation: 8,
    },
    payButtonNormal: {
        padding: 7,
        shadowOpacity: 0.15,
        elevation: 2,
    },
    payButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    payButtonTextUrgent: {
        fontSize: 15,
    },
    payButtonTextNormal: {
        fontSize: 11,
    },
    historyToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    historyToggleText: {
        color: COLORS.primary,
        fontSize: 11,
        marginRight: 5,
        fontWeight: '700',
    },
    historyContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e8eaed',
        backgroundColor: '#fafbfc',
        borderRadius: 8,
        padding: 10,
    },
    historyTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e8eaed',
        backgroundColor: '#fff',
        borderRadius: 6,
        marginBottom: 6,
    },
    historyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    historyDate: {
        fontSize: 12,
        color: COLORS.dark,
        fontWeight: '600',
    },
    historyStatus: {
        fontSize: 9,
        color: COLORS.secondary,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    historyAmount: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#2E7D32',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    noHistoryText: {
        fontSize: 11,
        color: COLORS.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 5,
        padding: 12,
    },
    // Offline Modal Styles
    outlineButton: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    outlineButtonUrgent: {
        padding: 12,
        borderWidth: 2,
    },
    outlineButtonNormal: {
        padding: 6,
        borderWidth: 1,
    },
    outlineButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    outlineButtonTextUrgent: {
        fontSize: 13,
    },
    outlineButtonTextNormal: {
        fontSize: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalSubtitle: {
        fontSize: 13,
        color: COLORS.secondary,
        marginBottom: 4,
    },
    modalInfo: {
        fontSize: 12,
        color: '#666',
        marginBottom: 16,
        backgroundColor: COLORS.primary + '08',
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 6,
        marginTop: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    readOnlyInput: {
        padding: 12,
        backgroundColor: '#eee',
        borderRadius: 8,
        marginBottom: 10,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        marginBottom: 10,
        gap: 10,
    },
    datePickerText: {
        color: COLORS.dark,
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    textInput: {
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        minHeight: 80,
        textAlignVertical: 'top',
        color: COLORS.dark,
        fontSize: 13,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 10,
        borderStyle: 'dashed',
        marginTop: 5,
        backgroundColor: COLORS.primary + '05',
    },
    uploadButtonText: {
        marginLeft: 8,
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    imagePreviewContainer: {
        marginTop: 12,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
    },
    imagePreview: {
        width: 120,
        height: 120,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    imageName: {
        fontSize: 10,
        color: COLORS.secondary,
        marginTop: 8,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    }
});

export default AnalyticsTab;
