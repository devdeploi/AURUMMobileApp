
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import LinearGradient from 'react-native-linear-gradient';

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    // SafeAreaView, // Removed from react-native
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    TextInput,
    ScrollView,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const MerchantDashboardScreen = ({ user, onLogout, onUserUpdate, pauseAds, resumeAds }) => {
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

    const fetchProfile = useCallback(async () => {
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
    }, [user]);

    // Fetch Stats & Plans
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'plans' || activeTab === 'subscribers') {
            fetchPlans();
        }

        if (user) {
            fetchProfile();
        }
    }, [user, activeTab, fetchPlans, fetchProfile]);

    // Manage Ads based on active tab
    useEffect(() => {
        if (activeTab === 'profile') {
            if (pauseAds) pauseAds();
        } else {
            if (resumeAds) resumeAds();
        }
    }, [activeTab, pauseAds, resumeAds]);

    const handleUpdateProfile = async (updatedData) => {
        try {
            // Guard against event objects being passed directly
            if (updatedData && updatedData.nativeEvent) {
                console.warn("handleUpdateProfile received an event object unexpectedly.");
                setAlertConfig({ visible: true, title: 'Error', message: 'Invalid data submitted', type: 'error' });
                return;
            }

            setUpdatingProfile(true);
            const token = user.token;
            const id = user._id || user.id;

            // Sanitize payload to avoid circular structures and extra fields
            const payload = {
                name: updatedData.name,
                address: updatedData.address,
                gstin: updatedData.gstin,
                bankDetails: updatedData.bankDetails,
                shopImages: updatedData.shopImages,
                // Add validation or other fields as necessary
                phone: updatedData.phone, // Usually read-only but might need ensuring
                email: updatedData.email  // Usually read-only
            };

            const { data } = await axios.put(`${APIURL}/merchants/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const safeData = {
                ...data,
                bankDetails: data.bankDetails || { accountNumber: '', ifscCode: '', accountHolderName: '' },
                shopImages: data.shopImages || []
            };

            setProfileData(prev => ({ ...prev, ...safeData }));
            setIsEditingProfile(false);
            setAlertConfig({ visible: true, title: 'Success', message: 'Profile updated successfully', type: 'success' });
        } catch (error) {
            console.error("Update profile error", error);
            // Log specifically if cyclic
            if (error.message && error.message.includes('cyclic')) {
                console.error("Cyclic structure detected in payload", updatedData);
            }
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to update profile', type: 'error' });
        } finally {
            setUpdatingProfile(false);
        }
    };

    const verifyBankAccount = async () => {
        // Mock verification for now or implement API call if available
        setVerifyingBank(true);
        setTimeout(() => {
            setVerifyingBank(false);
            setAlertConfig({ visible: true, title: 'Verification', message: 'Bank details submission logic to be implemented.', type: 'info' });
        }, 1500);
    };

    const handleImageUpload = async (docType) => {
        // Launch image picker
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1200,
            maxHeight: 1200,
        };

        try {
            const response = await launchImageLibrary(options);

            // Handle cancellation
            if (response.didCancel) {
                console.log('User cancelled image picker');
                return;
            }

            // Handle errors
            if (response.errorCode) {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: response.errorMessage || 'Failed to pick image',
                    type: 'error'
                });
                return;
            }

            // Check if we have assets
            const assets = response.assets;
            if (!assets || assets.length === 0) {
                setAlertConfig({
                    visible: true,
                    title: 'Error',
                    message: 'No image selected',
                    type: 'error'
                });
                return;
            }

            const imageFile = assets[0];
            setUploadingDoc(true);
            const token = user.token;

            // 1. Upload to generic generic endpoint
            const uploadEndpoint = `${APIURL}/upload`;
            const uploadFormData = new FormData();
            uploadFormData.append('image', {
                uri: imageFile.uri,
                type: imageFile.type || 'image/jpeg',
                name: imageFile.fileName || `upload_${Date.now()}.jpg`,
            });

            const { data: imagePath } = await axios.post(uploadEndpoint, uploadFormData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            // 2. Update LOCAL STATE only (Preview)
            // We do NOT call handleUpdateProfile here anymore.
            // The user must click "Save Changes" to persist this.
            setProfileData(prev => {
                if (docType === 'addressProof') {
                    return { ...prev, addressProof: imagePath };
                } else {
                    const currentImages = prev.shopImages || [];
                    return { ...prev, shopImages: [...currentImages, imagePath] };
                }
            });

            // No fetchProfile() here because we want to keep the local change until saved

            setAlertConfig({
                visible: true,
                title: 'Image Uploaded',
                message: 'Image uploaded. Please tap "Save Changes" to apply.',
                type: 'success'
            });

        } catch (error) {
            console.error("Image upload error", error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: error.response?.data?.message || 'Failed to upload image',
                type: 'error'
            });
        } finally {
            setUploadingDoc(false);
        }
    };

    const removeShopImage = async (indexOrUrl) => {
        // Implement removal logic - Update LOCAL state only
        const currentImages = profileData.shopImages || [];
        let newImages;
        if (typeof indexOrUrl === 'number') {
            newImages = currentImages.filter((_, i) => i !== indexOrUrl);
        } else {
            newImages = currentImages.filter(url => url !== indexOrUrl);
        }

        setProfileData(prev => ({ ...prev, shopImages: newImages }));

        // Optional: Show specific alert or just let them see it removed
    };

    const handleUpgradePayment = async (billingCycle) => {
        console.log("Detailed Log: Starting handleUpgradePayment with billingCycle:", billingCycle);
        try {
            // 1. Create Order
            const token = user.token;
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };

            console.log("Detailed Log: Calling create-renewal-order at:", `${APIURL}/merchants/create-renewal-order`);

            const response = await axios.post(`${APIURL}/merchants/create-renewal-order`, {
                plan: 'Premium',
                billingCycle
            }, config);

            console.log("Detailed Log: create-renewal-order response received:", JSON.stringify(response.data));

            const { data } = response;
            const { order, keyId } = data;

            if (!order || !order.id) {
                console.error("Detailed Log: Critical Error - Invalid order received:", order);
                setAlertConfig({ visible: true, title: "Error", message: "Invalid order data received from server. Please contact support.", type: 'error' });
                return;
            }

            // 2. Open Razorpay
            // Ensure amount is an integer (paise) and currency is set
            const options = {
                description: `Upgrade to Premium Plan (${billingCycle})`,
                image: 'https://aurum-assets.s3.ap-south-1.amazonaws.com/aurum.png', // Logo
                currency: order.currency || 'INR',
                key: keyId || 'rzp_test_S6RoMCiZCpsLo7', // Fallback key if server doesn't send one
                amount: order.amount, // Amount in paise
                name: 'AURUM',
                order_id: order.id,
                theme: { color: COLORS.primary },
                prefill: {
                    email: user.email,
                    contact: user.phone,
                    name: user.name
                }
            };

            console.log("Detailed Log: Opening Razorpay with options:", JSON.stringify(options));

            // Add delay to allow modal to close fully
            setTimeout(() => {
                try {
                    RazorpayCheckout.open(options).then(async (rzpData) => {
                        console.log("Detailed Log: Razorpay success data:", rzpData);
                        // handle success
                        try {
                            // 3. Verify Payment
                            const verifyPayload = {
                                razorpay_order_id: rzpData.razorpay_order_id,
                                razorpay_payment_id: rzpData.razorpay_payment_id,
                                razorpay_signature: rzpData.razorpay_signature,
                                plan: 'Premium',
                                billingCycle
                            };

                            console.log("Detailed Log: Verifying payment with payload:", verifyPayload);

                            const verifyRes = await axios.post(`${APIURL}/merchants/verify-renewal`, verifyPayload, config);
                            console.log("Detailed Log: Verification response:", verifyRes.data);

                            if (verifyRes.data.success) {
                                setAlertConfig({ visible: true, title: "Success", message: "Plan upgraded to Premium!", type: 'success' });
                                if (onUserUpdate) {
                                    onUserUpdate({ ...user, plan: 'Premium', ...profileData, plan: 'Premium' });
                                }

                                fetchProfile(); // Refresh profile to show new plan
                                fetchPlans();
                            } else {
                                console.warn("Detailed Log: Payment verification returned success=false");
                                setAlertConfig({ visible: true, title: "Error", message: "Payment verification failed on server", type: 'error' });
                            }
                        } catch (err) {
                            console.error("Detailed Log: Verification error:", err);
                            setAlertConfig({ visible: true, title: "Error", message: "Payment verification failed due to network or server error", type: 'error' });
                        }
                    }).catch((error) => {
                        // handle failure
                        console.error("Detailed Log: Razorpay Checkout error:", error);
                        let errorMsg = 'Payment Cancelled or Failed';
                        if (error.description) errorMsg = error.description;
                        else if (error.error && error.error.description) errorMsg = error.error.description;

                        if (error.code && error.code !== 0) {
                            setAlertConfig({ visible: true, title: "Payment Failed", message: errorMsg, type: 'error' });
                        }
                    });
                } catch (checkoutError) {
                    console.error("Detailed Log: Synchronous error opening Razorpay:", checkoutError);
                    setAlertConfig({ visible: true, title: "Error", message: "Could not open payment gateway. Please check your app configuration.", type: 'error' });
                }
            }, 600);


        } catch (err) {
            console.error("Detailed Log: handleUpgradePayment outer error:", err);
            const errMsg = err.response?.data?.message || err.message || 'Upgrade initiation failed.';
            setAlertConfig({ visible: true, title: "Error", message: errMsg, type: 'error' });
        }
    };

    const handleRefresh = useCallback(async () => {
        await Promise.all([fetchPlans(), fetchProfile()]);
    }, [fetchPlans, fetchProfile]);

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
                        <MerchantOverview
                            user={{ ...user, ...profileData }}
                            stats={stats}
                            plans={plans}
                            refreshing={loadingPlans}
                            onRefresh={handleRefresh}
                        />
                    </View>
                );
            case 'plans':
                return (
                    <MerchantPlans
                        user={{ ...user, ...profileData }}
                        loadingPlans={loadingPlans}
                        plans={plans}
                        onPlanCreated={fetchPlans}
                        onRefresh={fetchPlans}
                    />
                );
            case 'subscribers':
                return <MerchantUsers user={{ ...user, ...profileData }} />;
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
                        onRefresh={fetchProfile}
                        pauseAds={pauseAds}
                        resumeAds={resumeAds}
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
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
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
        // marginTop: 35, // Removed hardcoded margin
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
