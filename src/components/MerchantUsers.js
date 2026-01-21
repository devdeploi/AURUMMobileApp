/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Modal,
    Linking,
    TextInput,
    ScrollView,
    RefreshControl
} from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { APIURL, BASE_URL } from '../constants/api';
import CustomAlert from './CustomAlert';

const MerchantUsers = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [subscribers, setSubscribers] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Action States
    const [actionLoading, setActionLoading] = useState(null); // ID of payment being processed

    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const showCustomAlert = (title, message, type = 'info', buttons = []) => {
        setAlertConfig({ visible: true, title, message, type, buttons });
    };

    // Manual Payment State
    const [showManualModal, setShowManualModal] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [manualForm, setManualForm] = useState({ amount: '', notes: '' });
    const [submittingManual, setSubmittingManual] = useState(false);

    // History Details State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const openHistoryModal = async (subscriber) => {
        setSelectedSubscriber(subscriber);
        setShowHistoryModal(true);
        setLoadingHistory(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APIURL}/payments/history/${subscriber.plan._id}/${subscriber.user._id}`, config);
            setPaymentHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
            showCustomAlert("Error", "Failed to fetch payment history", "error");
        } finally {
            setLoadingHistory(false);
        }
    };

    // Fetch Data
    const fetchData = useCallback(async () => {
        try {
            if (!user) return;
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // 1. Fetch Pending Payments
            const pendingRes = await axios.get(`${APIURL}/payments/offline/pending`, config);
            setPendingPayments(pendingRes.data);

            // 2. Fetch Subscribers
            const subRes = await axios.get(`${APIURL}/chit-plans/my-subscribers`, config);

            // Deduplicate based on User ID + Plan ID
            const uniqueSubscribers = subRes.data.filter((v, i, a) =>
                a.findIndex(t => (t.user._id === v.user._id && t.plan._id === v.plan._id)) === i
            );

            setSubscribers(uniqueSubscribers);

        } catch (error) {
            console.error("Error fetching merchant users data", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // --- Handlers ---

    const handleApprove = (paymentId) => {
        showCustomAlert(
            "Approve Payment",
            "Are you sure you want to approve this offline payment?",
            "warning",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Approve",
                    onPress: () => executeApprove(paymentId)
                }
            ]
        );
    };

    const executeApprove = async (paymentId) => {
        setActionLoading(paymentId);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${APIURL}/payments/offline/${paymentId}/approve`, {}, config);
            showCustomAlert("Success", "Payment approved successfully", "success");
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Approve failed", error);
            showCustomAlert("Error", "Failed to approve payment", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (paymentId) => {
        showCustomAlert(
            "Reject Payment",
            "Are you sure you want to reject this payment?",
            "warning",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    onPress: () => executeReject(paymentId)
                }
            ]
        );
    };

    const executeReject = async (paymentId) => {
        setActionLoading(paymentId);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${APIURL}/payments/offline/${paymentId}/reject`, {}, config);
            showCustomAlert("Rejected", "Payment rejected successfully", "success");
            fetchData();
        } catch (error) {
            console.error("Reject failed", error);
            showCustomAlert("Error", "Failed to reject payment", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const openManualPaymentModal = (subscriber) => {
        setSelectedSubscriber(subscriber);
        setManualForm({
            amount: subscriber.plan.monthlyAmount.toString(),
            notes: ''
        });
        setShowManualModal(true);
    };

    const submitManualPayment = async () => {
        if (!selectedSubscriber) return;
        if (!manualForm.amount) {
            showCustomAlert("Error", "Please enter an amount", "error");
            return;
        }

        setSubmittingManual(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`${APIURL}/payments/offline/record`, {
                chitPlanId: selectedSubscriber.plan._id,
                userId: selectedSubscriber.user._id,
                amount: manualForm.amount,
                notes: manualForm.notes,
                date: new Date().toISOString()
            }, config);

            setShowManualModal(false);
            showCustomAlert("Success", "Payment recorded successfully", "success");
            fetchData();

        } catch (error) {
            console.error("Manual payment failed", error);
            showCustomAlert("Error", "Failed to record payment", "error");
        } finally {
            setSubmittingManual(false);
        }
    };

    const viewProof = (proofPath) => {
        if (!proofPath) return;
        const url = `${BASE_URL}${proofPath}`;
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    // --- Render Items ---

    const renderPendingPayment = ({ item }) => (
        <View style={styles.pendingCard}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Image
                        source={{ uri: item.user?.profileImage ? `${BASE_URL}${item.user.profileImage}` : 'https://via.placeholder.com/100' }}
                        style={styles.avatar}
                    />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.userName}>{item.user?.name || 'Unknown'}</Text>
                        <Text style={styles.userPhone}>{item.user?.phone}</Text>
                    </View>
                </View>
                <View style={styles.amountBadge}>
                    <Text style={styles.amountText}>₹{item.amount}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.row}>
                    <Text style={styles.label}>Plan:</Text>
                    <Text style={styles.value}>{item.chitPlan?.planName}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
                </View>
                {item.notes && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Notes:</Text>
                        <Text style={[styles.value, { fontStyle: 'italic' }]}>{item.notes}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                {item.proofImage ? (
                    <TouchableOpacity style={styles.proofButton} onPress={() => viewProof(item.proofImage)}>
                        <Icon name="image" size={14} color={COLORS.primary} />
                        <Text style={styles.proofButtonText}>View Proof</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.noProofText}>No Proof</Text>
                )}

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleReject(item._id)}
                        disabled={actionLoading === item._id}
                    >
                        <Icon name="times" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApprove(item._id)}
                        disabled={actionLoading === item._id}
                    >
                        {actionLoading === item._id ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Icon name="check" size={14} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderSubscriber = ({ item }) => {
        const percentage = Math.round((item.subscription.installmentsPaid / item.plan.durationMonths) * 100);
        const remainingBalance = item.plan.totalAmount - item.subscription.totalAmountPaid;
        const monthsDueCount = item.subscription.pendingAmount > 0
            ? Math.ceil(item.subscription.pendingAmount / item.plan.monthlyAmount)
            : 0;

        return (
            <View style={styles.subscriberCard}>
                <View style={styles.subHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.initialAvatar}>
                            <Text style={styles.initialText}>{item.user.name?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            <Text style={styles.userPhone}>{item.user.phone}</Text>
                        </View>
                    </View>
                    <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{item.plan.planName}</Text>
                    </View>
                </View>

                <View style={styles.subBody}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{percentage}% ({item.subscription.installmentsPaid}/{item.plan.durationMonths})</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Paid</Text>
                            <Text style={styles.statValue}>₹{item.subscription.totalAmountPaid}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Balance</Text>
                            <Text style={styles.statValue}>₹{remainingBalance}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.subFooter}>
                    {monthsDueCount > 0 ? (
                        <View style={[styles.statusTag, styles.statusDue]}>
                            <Icon name="exclamation-circle" size={12} color="#D32F2F" />
                            <Text style={styles.statusDueText}>{monthsDueCount} Months Due</Text>
                        </View>
                    ) : (
                        <View style={[styles.statusTag, styles.statusOk]}>
                            <Icon name="check-circle" size={12} color="#2E7D32" />
                            <Text style={styles.statusOkText}>Up-to-Date</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.viewHistoryButton}
                        onPress={() => openHistoryModal(item)}
                    >
                        <Icon name="history" size={14} color={COLORS.secondary} />
                        <Text style={styles.viewHistoryText}>History</Text>
                    </TouchableOpacity>



                    <TouchableOpacity
                        style={[
                            styles.payOfflineButton,
                            remainingBalance <= 0 && { opacity: 0.5 }
                        ]}
                        onPress={() => openManualPaymentModal(item)}
                        disabled={remainingBalance <= 0}
                    >
                        <Text style={styles.payOfflineText}>Paid Offline</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Pending Payments Section */}
                {pendingPayments.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="clock" size={16} color={COLORS.warning} />
                            <Text style={styles.sectionTitle}>Pending Validations ({pendingPayments.length})</Text>
                        </View>
                        <FlatList
                            data={pendingPayments}
                            renderItem={renderPendingPayment}
                            keyExtractor={item => item._id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* Subscribers Section */}
                <View style={[styles.section, { marginTop: pendingPayments.length > 0 ? 20 : 0 }]}>
                    <View style={styles.sectionHeader}>
                        <Icon name="users" size={16} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>User Subscriptions</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : subscribers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="users-slash" size={40} color={COLORS.secondary} />
                            <Text style={styles.emptyText}>No subscribers found.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={subscribers}
                            renderItem={renderSubscriber}
                            keyExtractor={item => item.user._id + item.plan._id}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            </ScrollView>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />

            {/* Processing Modal */}
            <Modal transparent={true} visible={!!actionLoading} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'white', padding: 25, borderRadius: 15, alignItems: 'center', elevation: 5 }}>
                        <ActivityIndicator size="large" color="#915200" />
                        <Text style={{ marginTop: 15, fontWeight: 'bold', fontSize: 16, color: '#915200' }}>Processing Request...</Text>
                        <Text style={{ marginTop: 5, fontSize: 12, color: '#666' }}>Sending notifications...</Text>
                    </View>
                </View>
            </Modal>

            {/* Manual Payment Modal */}
            <Modal
                transparent={true}
                visible={showManualModal}
                animationType="slide"
                onRequestClose={() => setShowManualModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Record Manual Payment</Text>
                            <TouchableOpacity onPress={() => setShowManualModal(false)}>
                                <Icon name="times" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {selectedSubscriber && (
                            <ScrollView>
                                <View style={styles.modalUserCard}>
                                    <View style={styles.modalAvatar}>
                                        <Text style={styles.modalAvatarText}>{selectedSubscriber.user.name?.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.modalUserName}>{selectedSubscriber.user.name}</Text>
                                        <Text style={styles.modalUserPlan}>{selectedSubscriber.plan.planName}</Text>
                                    </View>
                                </View>

                                <Text style={styles.inputLabel}>Amount (₹)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={manualForm.amount}
                                    onChangeText={t => setManualForm({ ...manualForm, amount: t })}
                                    keyboardType="numeric"
                                />

                                <Text style={styles.inputLabel}>Notes</Text>
                                <TextInput
                                    style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                                    value={manualForm.notes}
                                    onChangeText={t => setManualForm({ ...manualForm, notes: t })}
                                    multiline
                                    placeholder="Paid via Cash/UPI..."
                                />

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={submitManualPayment}
                                    disabled={submittingManual}
                                >
                                    {submittingManual ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Record Payment</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* History Modal */}
            <Modal
                transparent={true}
                visible={showHistoryModal}
                animationType="slide"
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Subscription History</Text>
                            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                <Icon name="times" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {selectedSubscriber && (
                            <FlatList
                                data={paymentHistory}
                                keyExtractor={item => item._id}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                ListHeaderComponent={
                                    <>
                                        {/* User Info */}
                                        <View style={styles.modalUserCard}>
                                            <View style={styles.modalAvatar}>
                                                <Text style={styles.modalAvatarText}>{selectedSubscriber.user.name?.charAt(0)}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.modalUserName}>{selectedSubscriber.user.name}</Text>
                                                <Text style={styles.modalUserPlan}>{selectedSubscriber.plan.planName}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.statsRow}>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Total Paid</Text>
                                                <Text style={styles.statValue}>₹{selectedSubscriber.subscription.totalAmountPaid}</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Progress</Text>
                                                <Text style={styles.statValue}>{Math.round((selectedSubscriber.subscription.installmentsPaid / selectedSubscriber.plan.durationMonths) * 100)}%</Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Text style={styles.statLabel}>Status</Text>
                                                <Text style={[styles.statValue, { color: selectedSubscriber.subscription.status === 'completed' ? 'green' : 'orange' }]}>
                                                    {selectedSubscriber.subscription.status === 'completed' ? 'Done' : 'Active'}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 20, marginBottom: 10 }]}>Payment History</Text>

                                        {loadingHistory && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />}
                                    </>
                                }
                                ListEmptyComponent={
                                    !loadingHistory ? (
                                        <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No payments found.</Text>
                                    ) : null
                                }
                                renderItem={({ item }) => (
                                    <View style={styles.historyItem}>
                                        <View style={styles.historyLeft}>
                                            <Text style={styles.historyDate}>{new Date(item.paymentDate || item.createdAt).toLocaleDateString()}</Text>
                                            <Text style={styles.historyType}>{item.type === 'offline' ? 'Offline' : 'Online'}</Text>
                                        </View>
                                        <View style={styles.historyRight}>
                                            <Text style={styles.historyAmount}>₹{item.amount}</Text>
                                            <Text style={[styles.historyStatus, { color: item.status === 'Completed' ? 'green' : item.status === 'Rejected' ? 'red' : 'orange' }]}>{item.status}</Text>
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginLeft: 8,
    },
    // Pending Card
    pendingCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.warning
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
    },
    userName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    userPhone: {
        fontSize: 12,
        color: COLORS.secondary,
    },
    amountBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    amountText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 14,
    },
    cardBody: {
        backgroundColor: '#fafbfc',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: COLORS.secondary,
        width: 50,
        fontWeight: '600',
    },
    value: {
        fontSize: 12,
        color: COLORS.dark,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    proofButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        backgroundColor: COLORS.primary + '10',
        borderRadius: 6,
    },
    proofButtonText: {
        fontSize: 12,
        color: COLORS.primary,
        marginLeft: 6,
        fontWeight: '600',
    },
    noProofText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveButton: {
        backgroundColor: '#2E7D32',
    },
    rejectButton: {
        backgroundColor: '#D32F2F',
    },
    // Subscriber Card
    subscriberCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    initialAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    planBadge: {
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    planBadgeText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '600',
    },
    viewHistoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
        marginRight: 8,
    },
    viewHistoryText: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '600',
        marginLeft: 6,
    },
    subBody: {
        marginBottom: 12,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: COLORS.secondary,
    },
    progressValue: {
        fontSize: 12,
        color: COLORS.dark,
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fafbfc',
        padding: 10,
        borderRadius: 8,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 10,
        color: COLORS.secondary,
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    subFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusDue: {
        backgroundColor: '#FFEBEE',
    },
    statusOk: {
        backgroundColor: '#E8F5E9',
    },
    statusDueText: {
        fontSize: 11,
        color: '#D32F2F',
        marginLeft: 4,
        fontWeight: '600',
    },
    statusOkText: {
        fontSize: 11,
        color: '#2E7D32',
        marginLeft: 4,
        fontWeight: '600',
    },
    payOfflineButton: {
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    payOfflineText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.secondary,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    modalAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    modalUserName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    modalUserPlan: {
        fontSize: 12,
        color: COLORS.secondary,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 6,
        marginTop: 10,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.dark,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // History Styles
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyLeft: {
        flex: 1,
    },
    historyDate: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.dark,
    },
    historyType: {
        fontSize: 12,
        color: COLORS.secondary,
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
    },
    historyAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    historyStatus: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default MerchantUsers;
