
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import LinearGradient from 'react-native-linear-gradient';

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Image
} from 'react-native';
import { COLORS, FONTS } from '../styles/theme';
import BottomNav from '../components/BottomNav';
import axios from 'axios';
import { APIURL } from '../constants/api';
import Icon from 'react-native-vector-icons/FontAwesome5';

import RazorpayCheckout from 'react-native-razorpay';
import { launchImageLibrary } from 'react-native-image-picker';

import GoldTicker from '../components/GoldTicker';
import MerchantOverview from '../components/MerchantOverview';
import MerchantPlans from '../components/MerchantPlans';
import MerchantUsers from '../components/MerchantUsers';
import MerchantProfile from '../components/MerchantProfile';
import SubscriptionExpired from '../components/SubscriptionExpired';
import CustomAlert from '../components/CustomAlert';

const MerchantDashboardScreen = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [blockingRenewal, setBlockingRenewal] = useState(false);
    const [showRenewalModal, setShowRenewalModal] = useState(false);

    const merchantTabs = [
        { id: 'overview', icon: 'chart-pie', label: 'Overview' },
        { id: 'plans', icon: 'clipboard-list', label: 'My Plans' },
        { id: 'subscribers', icon: 'users', label: 'Users' },
        { id: 'profile', icon: 'user-cog', label: 'Profile' },
    ];

    // Custom Alert State
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

    const [stats, setStats] = useState({ activePlans: 0, totalEnrolled: 0 });
    const [plans, setPlans] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({ ...user });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // New Action States
    const [verifyingBank, setVerifyingBank] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const fetchPlans = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingPlans(true);
            const id = user._id || user.id;
            const token = user.token;

            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${id}?limit=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fetchedPlans = data.plans || [];
            setPlans(fetchedPlans);

            const activePlans = fetchedPlans.length;
            const totalEnrolled = fetchedPlans.reduce((acc, plan) => acc + (plan.subscribers ? plan.subscribers.length : 0), 0);

            // Calculate Financials
            const totalMonthly = fetchedPlans.reduce((acc, plan) => {
                const subCount = plan.subscribers ? plan.subscribers.length : 0;
                return acc + (plan.monthlyAmount * subCount);
            }, 0);

            const totalAUM = fetchedPlans.reduce((acc, plan) => {
                const subCount = plan.subscribers ? plan.subscribers.length : 0;
                return acc + (plan.totalAmount * subCount);
            }, 0);

            setStats({ activePlans, totalEnrolled, totalMonthly, totalAUM });

            // Derive subscribers from plans
            let allSubscribers = [];
            fetchedPlans.forEach(plan => {
                if (plan.subscribers) {
                    plan.subscribers.forEach(sub => {
                        allSubscribers.push({
                            ...sub,
                            planName: plan.planName,
                            planAmount: plan.monthlyAmount,
                            _id: sub._id || sub.id || Math.random().toString()
                        });
                    });
                }
            });
            setSubscribers(allSubscribers);

        } catch (error) {
            console.error("Error fetching merchant data", error);
        } finally {
            setLoadingPlans(false);
        }
    }, [user]);

    // Fetch Stats & Plans
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'plans' || activeTab === 'subscribers') {
            fetchPlans();
        }

        const fetchProfile = async () => {
            if (!user) return;
            try {
                const token = user.token;
                const id = user._id || user.id;
                const { data } = await axios.get(`${APIURL}/merchants/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Full DB Profile:", data);
                // Ensure nested objects exist
                const safeData = {
                    ...data,
                    bankDetails: data.bankDetails || { accountNumber: '', ifscCode: '', accountHolderName: '' },
                    shopImages: data.shopImages || []
                };
                setProfileData(prev => ({ ...prev, ...safeData }));
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user, activeTab, fetchPlans]);

    const handleUpdateProfile = async () => {
        setUpdatingProfile(true);
        try {
            const token = user.token;
            const id = user._id || user.id;
            await axios.put(`${APIURL}/merchants/${id}`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlertConfig({ visible: true, title: 'Success', message: 'Profile updated successfully', type: 'success' });
            setIsEditingProfile(false);
        } catch (error) {
            console.error(error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to update profile', type: 'error' });
        } finally {
            setUpdatingProfile(false);
        }
    };

    // Check for Expiry
    if (profileData.subscriptionExpiryDate) {
        const expiry = new Date(profileData.subscriptionExpiryDate);
        const now = new Date();
        const diffTime = now.getTime() - expiry.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays > 1 && profileData.subscriptionStatus === 'expired') {
            if (blockingRenewal) {
                return (
                    <LinearGradient
                        colors={['#ebdc87', '#f3e9bd']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.container}
                    >
                        <SafeAreaView style={{ flex: 1 }}>
                            <View style={{ flex: 1, padding: 20 }}>
                                <TouchableOpacity style={{ marginBottom: 20 }} onPress={() => setBlockingRenewal(false)}>
                                    <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Back</Text>
                                </TouchableOpacity>
                                <SubscriptionExpired
                                    user={user}
                                    onRenew={(updatedUser) => {
                                        setProfileData(prev => ({ ...prev, ...updatedUser }));
                                        setBlockingRenewal(false);
                                    }}
                                    existingPlanCount={stats.activePlans}
                                    plans={plans}
                                    onRefreshPlans={fetchPlans}
                                />
                            </View>
                        </SafeAreaView>
                    </LinearGradient>
                );
            }
            return (
                <LinearGradient
                    colors={['#ebdc87', '#f3e9bd']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.container}
                >
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.modalContent}>
                            <Icon name="lock" size={50} color={COLORS.danger} style={{ marginBottom: 20 }} />
                            <Text style={styles.modalTitle}>Subscription Expired</Text>
                            <Text style={styles.modalText}>Your grace period has ended. Please renew to continue.</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton, { width: '100%', marginBottom: 15 }]}
                                onPress={() => setBlockingRenewal(true)}
                            >
                                <Text style={styles.confirmButtonText}>Renew Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onLogout}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            );
        }
    }

    if (showRenewalModal) {
        return (
            <LinearGradient
                colors={['#ebdc87', '#f3e9bd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => setShowRenewalModal(false)}>
                                <Icon name="arrow-left" size={20} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.appTitle}>Renewal</Text>
                            <View style={{ width: 20 }} />
                        </View>
                        <SubscriptionExpired
                            user={user}
                            onRenew={(updatedUser) => {
                                setProfileData(prev => ({ ...prev, ...updatedUser }));
                                setShowRenewalModal(false);
                            }}
                            existingPlanCount={stats.activePlans}
                            plans={plans}
                            onRefreshPlans={fetchPlans}
                        />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // --- NEW HELPER FUNCTIONS ---

    const verifyBankAccount = async () => {
        const { accountNumber, ifscCode, accountHolderName } = profileData.bankDetails || {};
        if (!accountNumber || !ifscCode) {
            setAlertConfig({ visible: true, title: 'Missing Info', message: 'Please enter Account Number and IFSC code.', type: 'warning' });
            return;
        }

        setVerifyingBank(true);
        try {
            const { data } = await axios.post(`${APIURL}/kyc/verify-bank`, { accountNumber, ifscCode, accountHolderName });
            if (data.status === 'success') {
                const updatedBankDetails = {
                    ...profileData.bankDetails,
                    verifiedName: data.data.verifiedName,
                    bankName: data.data.bankName,
                    branchName: data.data.branchName,
                    verificationStatus: 'verified'
                };
                setProfileData(prev => ({ ...prev, bankDetails: updatedBankDetails }));
                setAlertConfig({ visible: true, title: 'Success', message: `Bank Verified: ${data.data.verifiedName}`, type: 'success' });
            } else {
                setAlertConfig({ visible: true, title: 'Failed', message: 'Bank Verification Failed', type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setAlertConfig({ visible: true, title: 'Error', message: error.response?.data?.message || "Bank Verification Failed", type: 'error' });
        } finally {
            setVerifyingBank(false);
        }
    };

    const handleImageUpload = async (type) => { // type: 'addressProof' or 'shopImage'
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });

        if (result.didCancel || !result.assets || result.assets.length === 0) return;

        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('image', {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || 'upload.jpg',
        });

        setUploadingDoc(true);
        try {
            const token = user.token;
            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            if (type === 'addressProof') {
                setProfileData(prev => ({ ...prev, addressProof: imagePath }));
            } else if (type === 'shopImage') {
                setProfileData(prev => ({
                    ...prev,
                    shopImages: [...(prev.shopImages || []), imagePath]
                }));
            }
            setAlertConfig({ visible: true, title: 'Success', message: 'Variable uploaded successfully', type: 'success' });

        } catch (error) {
            console.error("Upload failed", error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Image upload failed', type: 'error' });
        } finally {
            setUploadingDoc(false);
        }
    };

    const removeShopImage = (index) => {
        const newImages = [...(profileData.shopImages || [])];
        newImages.splice(index, 1);
        setProfileData(prev => ({ ...prev, shopImages: newImages }));
    };

    const handleUpgradePayment = async (billingCycle = 'monthly') => {
        if (profileData.plan === 'Premium') {
            setAlertConfig({ visible: true, title: 'Info', message: 'You are already a Premium member!', type: 'info' });
            return;
        }

        console.log('Initiating upgrade payment...', billingCycle);

        try {
            // 1. Create Order
            console.log('Creating subscription order...');
            const amount = billingCycle === 'yearly' ? 50000 : 5000;

            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: amount,
                billingCycle: billingCycle
            });
            console.log('Order created:', order);


            // 2. Open Razorpay
            const options = {
                description: `Upgrade to Premium Plan (${billingCycle})`,
                currency: order.currency,
                key: 'rzp_test_S6RoMCiZCpsLo7',
                amount: order.amount,
                name: 'Aurum Jewellery',
                order_id: order.id,
                theme: { color: COLORS.primary }
            };

            console.log('Opening Razorpay options:', options);
            RazorpayCheckout.open(options).then(async (data) => {
                // handle success
                console.log('Razorpay success:', data);
                try {
                    console.log('Verifying payment...');

                    const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                        razorpay_order_id: data.razorpay_order_id,
                        razorpay_payment_id: data.razorpay_payment_id,
                        razorpay_signature: data.razorpay_signature,
                        billingCycle: billingCycle
                    });
                    console.log('Verification response:', verifyRes.data);

                    if (verifyRes.data.status === 'success') {

                        const token = user.token;
                        const id = user._id || user.id;
                        // Update Plan on Backend
                        const updatePayload = {
                            ...profileData,
                            plan: 'Premium',
                            paymentId: data.razorpay_payment_id,
                            billingCycle: billingCycle
                        };
                        const { data: updatedMerchant } = await axios.put(`${APIURL}/merchants/${id}`, updatePayload, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        setProfileData(prev => ({ ...prev, ...updatedMerchant }));
                        setAlertConfig({ visible: true, title: 'Success', message: 'Welcome to Premium Plan!', type: 'success' });
                    }
                } catch (err) {
                    setAlertConfig({ visible: true, title: 'Error', message: 'Payment Verification Failed', type: 'error' });
                }
            }).catch((error) => {
                // handle failure
                console.log('Razorpay failure:', error);
                console.log(error);
                setAlertConfig({ visible: true, title: 'Error', message: `Payment Failed: ${error.description || 'Unknown error'}`, type: 'error' });
            });


        } catch (error) {
            console.error(error);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to initiate payment', type: 'error' });
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <View style={{ flex: 1 }}>
                        {(() => {
                            if (profileData.subscriptionExpiryDate) {
                                const expiry = new Date(profileData.subscriptionExpiryDate);
                                const today = new Date();
                                const diffTime = expiry.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isExpired = profileData.subscriptionStatus === 'expired';

                                if (isExpired || (diffDays <= 7 && diffDays > 0)) {
                                    return (
                                        <View style={{ backgroundColor: isExpired ? '#fee2e2' : '#fef3c7', padding: 12, margin: 16, marginBottom: 0, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontWeight: 'bold', color: isExpired ? COLORS.danger : COLORS.warning }}>
                                                    {isExpired ? 'In Grace Period' : 'Expiring Soon'}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: COLORS.secondary }}>
                                                    {isExpired ? 'Renew immediately.' : `Expires in ${diffDays} days.`}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={{ backgroundColor: isExpired ? COLORS.danger : COLORS.warning, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                                                onPress={() => setShowRenewalModal(true)}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Renew</Text>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }
                            }
                            return null;
                        })()}
                        <MerchantOverview user={user} stats={stats} />
                    </View>
                );
            case 'plans':
                return (
                    <MerchantPlans
                        user={{ ...user, ...profileData }}
                        loadingPlans={loadingPlans}
                        plans={plans}
                        onPlanCreated={fetchPlans}
                    />
                );
            case 'subscribers':
                return <MerchantUsers user={user} />;
            case 'profile':
                return (
                    <MerchantProfile
                        user={user}
                        profileData={profileData}
                        setProfileData={setProfileData}
                        isEditingProfile={isEditingProfile}
                        setIsEditingProfile={setIsEditingProfile}
                        handleUpdateProfile={handleUpdateProfile}
                        updatingProfile={updatingProfile}
                        verifyBankAccount={verifyBankAccount}
                        verifyingBank={verifyingBank}
                        handleImageUpload={handleImageUpload}
                        uploadingDoc={uploadingDoc}
                        removeShopImage={removeShopImage}
                        handleUpgradePayment={handleUpgradePayment}
                        setShowLogoutModal={setShowLogoutModal}
                        onLogout={onLogout}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <LinearGradient
            colors={['#ffffffff', '#ffffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <Image source={require('../assets/AURUM.png')} style={{ width: 30, height: 30, marginRight: 10, resizeMode: 'contain' }} />
                        <Text style={styles.appTitle}>A U R U M</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <GoldTicker />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.mainContent}>
                    {renderContent()}
                </View>

                {/* Bottom Nav */}
                <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tabs={merchantTabs} />

                {/* Logout Modal */}
                <Modal visible={showLogoutModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Icon name="exclamation-triangle" size={40} color={COLORS.warning} style={{ marginBottom: 15 }} />
                            <Text style={styles.modalTitle}>Confirm Logout</Text>
                            <Text style={styles.modalText}>Are you sure you want to log out?</Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowLogoutModal(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onLogout}>
                                    <Text style={styles.confirmButtonText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onClose={hideAlert}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 35,
    },
    header: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        // paddingVertical: 2,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(240, 240, 240, 0.5)',
        backgroundColor: '#ebdc87',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 1,
    },
    mainContent: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 15,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default MerchantDashboardScreen;
