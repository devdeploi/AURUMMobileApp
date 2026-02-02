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
    RefreshControl,
    LayoutAnimation,
    Platform,
    UIManager
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { APIURL, BASE_URL } from '../constants/api';
import CustomAlert from './CustomAlert';
import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import aurumLogo from '../assets/AURUM.png';
import safproLogo from '../../public/assests/Safpro-logo.png';
import RNFS from 'react-native-fs';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const MerchantUsers = ({ user }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
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

    // --- PDF Generation Logic ---

    const fetchImageAsBase64 = async (url) => {
        try {
            // If it's a local file from resolveAssetSource
            if (url && (url.startsWith('file://') || url.startsWith('/'))) {
                const cleanPath = url.replace('file://', '');
                const base64Data = await RNFS.readFile(cleanPath, 'base64');
                return `data:image/png;base64,${base64Data}`;
            }

            // Fallback for remote URLs or others
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    };

    const shareFile = async (filePath) => {
        try {
            const shareOptions = {
                title: 'Share PDF',
                url: Platform.OS === 'android' ? `file://${filePath}` : `file://${filePath}`,
                type: 'application/pdf',
                failOnCancel: false
            };
            await Share.open(shareOptions);
        } catch (error) {
            console.log("Share Error:", error);
        }
    };

    const createAndDownloadPDF = async (html, fileName) => {
        try {
            const cleanFileName = fileName.replace(/[^a-z0-9]/gi, '_');
            const options = {
                html,
                fileName: cleanFileName,
                directory: 'Documents',
            };

            const file = await generatePDF(options);

            if (!file || !file.filePath) {
                throw new Error("Failed to generate PDF");
            }

            if (Platform.OS === 'android') {
                const downloadPath = `${RNFS.DownloadDirectoryPath}/${cleanFileName}.pdf`;
                try {
                    // Check if file exists and delete it before copying
                    const exists = await RNFS.exists(downloadPath);
                    if (exists) {
                        await RNFS.unlink(downloadPath);
                    }
                    await RNFS.copyFile(file.filePath, downloadPath);
                    showCustomAlert("Success", "PDF saved successfully to Downloads folder", "success", [
                        {
                            text: "Share",
                            onPress: () => shareFile(downloadPath)
                        },
                        { text: "OK" }
                    ]);
                } catch (copyErr) {
                    console.error("File Copy Error:", copyErr);
                    // Fallback to sharing the original file if copy fails
                    await shareFile(file.filePath);
                }
            } else {
                // For iOS, trigger the share sheet immediately as "Documents" isn't easily accessible
                await shareFile(file.filePath);
            }

        } catch (error) {
            console.error("PDF Download Error:", error);
            showCustomAlert("Error", "Failed to generate PDF", "error");
        }
    };

    const generateInvoice = async (payment, subscriber) => {
        setLoading(true);
        try {
            // 1. Load Logos
            let aurumLogoImgTag = 'AURUM';
            let safproLogoImgTag = 'Safpro';

            if (Platform.OS === 'android' && !__DEV__) {
                aurumLogoImgTag = `<img src="file:///android_asset/AURUM.png" style="width: 70px; height: auto;" />`;
                safproLogoImgTag = `<img src="file:///android_asset/Safpro-logo.png" style="width: 120px; height: auto;" />`;
            } else {
                const aurumLogoUrl = Image.resolveAssetSource(aurumLogo).uri;
                const aurumLogoBase64 = await fetchImageAsBase64(aurumLogoUrl);
                if (aurumLogoBase64) aurumLogoImgTag = `<img src="${aurumLogoBase64}" style="width: 70px; height: auto;" />`;

                const safproLogoUrl = Image.resolveAssetSource(safproLogo).uri;
                const safproLogoBase64 = await fetchImageAsBase64(safproLogoUrl);
                if (safproLogoBase64) safproLogoImgTag = `<img src="${safproLogoBase64}" style="width: 120px; height: auto;" />`;
            }

            let shopLogoImgTag = '';
            if (user.shopLogo) {
                const shopLogoUrl = `${BASE_URL}${user.shopLogo}`;
                const shopLogoBase64 = await fetchImageAsBase64(shopLogoUrl);
                if (shopLogoBase64) {
                    shopLogoImgTag = `<img src="${shopLogoBase64}" style="width: 70px; height: 70px; border-radius: 35px; object-fit: cover;" />`;
                }
            }

            // 2. Data Prep
            const planName = subscriber.plan?.planName || subscriber.chitPlan?.planName || 'Unknown Plan';
            const paymentDate = new Date(payment.paymentDate || payment.date || new Date()).toLocaleDateString();
            const merchantName = user.name.toUpperCase();
            const customerName = subscriber.user.name.toUpperCase();

            // 3. HTML Template
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #915200; }
                        .logo-left, .logo-right { width: 100px; display: flex; align-items: center; justify-content: center; }
                        .header-center { text-align: center; flex: 1; margin: 0 10px; }
                        .header-center h2 { color: #915200; margin: 0; font-size: 18px; text-transform: uppercase; }
                        .header-center p { margin: 2px 0; font-size: 10px; color: #666; }
                        
                        .title-section { text-align: center; margin-bottom: 30px; }
                        .title-section h1 { color: #915200; margin: 0; font-size: 24px; letter-spacing: 2px; }
                        .title-section p { color: #666; margin: 5px 0 0; font-size: 12px; }

                        .grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .col { width: 45%; }
                        .label { color: #915200; font-weight: bold; font-size: 12px; margin-bottom: 5px; }
                        .name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
                        .info { font-size: 12px; color: #555; line-height: 1.4; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background-color: #915200; color: white; padding: 10px; text-align: left; font-size: 12px; }
                        td { padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; }
                        .total-row td { background-color: #fffbf0; font-weight: bold; color: #915200; }
                        .footer { text-align: center; margin-top: 50px; color: #915200; font-size: 12px; border-top: 1px solid #eee; padding-top: 30px; }
                        .brand-strip { background-color: #915200; color: white; text-align: center; padding: 5px; font-size: 10px; position: fixed; bottom: 0; left: 0; right: 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-left">${aurumLogoImgTag}</div>
                        <div class="header-center">
                            <h2>${merchantName}</h2>
                            <p>${user.address || ''}</p>
                            <p>Phone: ${user.phone}${user.email ? ' | ' + user.email : ''}</p>
                        </div>
                        <div class="logo-right">${shopLogoImgTag}</div>
                    </div>

                    <div class="title-section">
                        <h1>PAYMENT RECEIPT</h1>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="grid">
                        <div class="col">
                            <div class="label">TO:</div>
                            <div class="name">${customerName}</div>
                            <div class="info">
                                Phone: ${subscriber.user.phone}<br/>
                                ${subscriber.user.email ? subscriber.user.email : ''}
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Details</th>
                                <th style="text-align: right;">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Plan Name</td>
                                <td>${planName}</td>
                                <td style="text-align: right;"></td>
                            </tr>
                            <tr>
                                <td>Payment Mode</td>
                                <td>${payment.type || "Offline"}</td>
                                <td style="text-align: right;"></td>
                            </tr>
                            <tr>
                                <td>Payment Date</td>
                                <td>${paymentDate}</td>
                                <td style="text-align: right;"></td>
                            </tr>
                             <tr>
                                <td>Notes</td>
                                <td>${payment.notes || "-"}</td>
                                <td style="text-align: right;"></td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="2">TOTAL RECEIVED</td>
                                <td style="text-align: right;">Rs. ${Number(payment.amount).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>Thank you!</p>
                        <p style="font-size: 10px; color: #888; font-weight: normal;">If you have any questions, please contact the merchant.</p>
                        
                        <div style="margin-top: 20px;">
                            <p style="font-size: 10px; color: #999; margin-bottom: 5px;">Powered By</p>
                            ${safproLogoImgTag}
                        </div>
                    </div>
                </body>
                </html>
            `;

            await createAndDownloadPDF(html, `Receipt_${subscriber.user.name}_${Date.now()}`);

        } catch (error) {
            console.error("Invoice Gen Error", error);
            showCustomAlert("Error", "Failed to generate invoice", "error");
        } finally {
            setLoading(false);
        }
    };

    const generateStatement = async (subscriber, history) => {
        setLoading(true);
        try {
            // 1. Load Logos
            let aurumLogoImgTag = 'AURUM';
            let safproLogoImgTag = 'Safpro';

            if (Platform.OS === 'android' && !__DEV__) {
                aurumLogoImgTag = `<img src="file:///android_asset/AURUM.png" style="width: 70px; height: auto;" />`;
                safproLogoImgTag = `<img src="file:///android_asset/Safpro-logo.png" style="width: 120px; height: auto;" />`;
            } else {
                const aurumLogoUrl = Image.resolveAssetSource(aurumLogo).uri;
                const aurumLogoBase64 = await fetchImageAsBase64(aurumLogoUrl);
                if (aurumLogoBase64) aurumLogoImgTag = `<img src="${aurumLogoBase64}" style="width: 70px; height: auto;" />`;

                const safproLogoUrl = Image.resolveAssetSource(safproLogo).uri;
                const safproLogoBase64 = await fetchImageAsBase64(safproLogoUrl);
                if (safproLogoBase64) safproLogoImgTag = `<img src="${safproLogoBase64}" style="width: 120px; height: auto;" />`;
            }

            let shopLogoImgTag = '';
            if (user.shopLogo) {
                const shopLogoUrl = `${BASE_URL}${user.shopLogo}`;
                const shopLogoBase64 = await fetchImageAsBase64(shopLogoUrl);
                if (shopLogoBase64) {
                    shopLogoImgTag = `<img src="${shopLogoBase64}" style="width: 70px; height: 70px; border-radius: 35px; object-fit: cover;" />`;
                }
            }

            const merchantName = user.name.toUpperCase();
            const customerName = subscriber.user.name.toUpperCase();
            const planName = subscriber.plan?.planName || 'Unknown Plan';
            const totalPlanAmount = subscriber.plan?.totalAmount || 0;

            let totalPaid = 0;
            const sortedHistory = [...history].sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

            const rowsHtml = sortedHistory.map(pay => {
                if (pay.status === 'Completed') totalPaid += Number(pay.amount);
                return `
                    <tr>
                        <td>${new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}</td>
                        <td>${pay.notes || "Installment Payment"}</td>
                        <td>${pay.type === 'offline' ? 'Offline' : 'Online'}</td>
                        <td style="text-align: right;">Rs. ${Number(pay.amount).toFixed(2)}</td>
                    </tr>
                `;
            }).join('');

            const balanceDue = totalPlanAmount - totalPaid;
            const balanceColor = balanceDue > 0 ? '#D32F2F' : '#2E7D32';

            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #915200; }
                        .logo-left, .logo-right { width: 100px; display: flex; align-items: center; justify-content: center; }
                        .header-center { text-align: center; flex: 1; margin: 0 10px; }
                        .header-center h2 { color: #915200; margin: 0; font-size: 18px; text-transform: uppercase; }
                        .header-center p { margin: 2px 0; font-size: 10px; color: #666; }
                        
                        .title-section { text-align: center; margin-bottom: 30px; }
                        .title-section h1 { color: #915200; margin: 0; font-size: 24px; letter-spacing: 2px; }
                        .title-section p { color: #666; margin: 5px 0 0; font-size: 12px; }

                        .grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .col { width: 45%; }
                        .label { color: #915200; font-weight: bold; font-size: 12px; margin-bottom: 5px; }
                        .name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
                        .info { font-size: 12px; color: #555; line-height: 1.4; }
                        .plan-info { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 12px; border-left: 4px solid #915200; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th { background-color: #915200; color: white; padding: 8px; text-align: left; font-size: 11px; }
                        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; }
                        .total-row td { background-color: #fffbf0; font-weight: bold; color: #915200; }
                        .footer { text-align: center; margin-top: 50px; color: #915200; font-size: 12px; border-top: 1px solid #eee; padding-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo-left">${aurumLogoImgTag}</div>
                        <div class="header-center">
                            <h2>${merchantName}</h2>
                            <p>${user.address || ''}</p>
                            <p>Phone: ${user.phone}${user.email ? ' | ' + user.email : ''}</p>
                        </div>
                        <div class="logo-right">${shopLogoImgTag}</div>
                    </div>

                    <div class="title-section">
                        <h1>STATEMENT OF ACCOUNT</h1>
                        <p>Generated On: ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="grid">
                        <div class="col">
                            <div class="label">TO:</div>
                            <div class="name">${customerName}</div>
                            <div class="info">
                                Phone: ${subscriber.user.phone}<br/>
                            </div>
                        </div>
                    </div>

                    <div class="plan-info">
                        <strong>Plan:</strong> ${planName} (Total Value: Rs. ${Number(totalPlanAmount).toLocaleString()})
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th style="text-align: right;">Amount (INR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                            <tr class="total-row">
                                <td colspan="3">TOTAL PAID</td>
                                <td style="text-align: right;">Rs. ${totalPaid.toFixed(2)}</td>
                            </tr>
                             <tr class="total-row">
                                <td colspan="3">BALANCE DUE</td>
                                <td style="text-align: right; color: ${balanceColor};">Rs. ${balanceDue.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                     <div class="footer">
                        <p>Thank you for your business!</p>
                        <div style="margin-top: 20px;">
                            <p style="font-size: 10px; color: #999; margin-bottom: 5px;">Powered By</p>
                            ${safproLogoImgTag}
                        </div>
                    </div>
                </body>
                </html>
            `;

            await createAndDownloadPDF(html, `Statement_${subscriber.user.name}_${Date.now()}`);

        } catch (error) {
            console.error("Statement Gen Error", error);
            showCustomAlert("Error", "Failed to generate statement", "error");
        } finally {
            setLoading(false);
        }
    };

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

    const toggleSearch = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowSearch(!showSearch);
        if (showSearch) setSearchQuery('');
    };

    const filteredSubscribers = React.useMemo(() => {
        if (!searchQuery) return subscribers;
        const lower = searchQuery.toLowerCase();
        return subscribers.filter(sub =>
            (sub.user?.name?.toLowerCase() || '').includes(lower) ||
            (sub.user?.phone || '').includes(lower) ||
            (sub.plan?.planName?.toLowerCase() || '').includes(lower)
        );
    }, [subscribers, searchQuery]);

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
            const paymentToApprove = pendingPayments.find(p => p._id === paymentId);

            await axios.put(`${APIURL}/payments/offline/${paymentId}/approve`, {}, config);
            showCustomAlert("Success", "Payment approved successfully", "success", [
                {
                    text: "Invoice",
                    onPress: () => {
                        if (paymentToApprove) {
                            // detailed object for generateInvoice
                            const invoicePayment = {
                                ...paymentToApprove,
                                type: 'offline', // ensure type is set
                            };
                            const invoiceSubscriber = {
                                user: paymentToApprove.user,
                                chitPlan: paymentToApprove.chitPlan
                            };
                            generateInvoice(invoicePayment, invoiceSubscriber);
                        }
                    }
                },
                { text: "OK", onPress: () => { } }
            ]);
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

            showCustomAlert("Success", "Payment recorded successfully", "success", [
                {
                    text: "Invoice",
                    onPress: () => {
                        // Need to construct payment object similar to what we did in web
                        const paymentData = {
                            amount: manualForm.amount,
                            notes: manualForm.notes,
                            date: new Date().toISOString(),
                            type: 'offline',
                            paymentDate: new Date().toISOString()
                        };
                        generateInvoice(paymentData, selectedSubscriber);
                    }
                },
                { text: "OK", onPress: () => { } }
            ]);

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
                        {item.user.profileImage ? (
                            <Image
                                source={{ uri: `${BASE_URL}${item.user.profileImage}` }}
                                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' }}
                            />
                        ) : (
                            <View style={styles.initialAvatar}>
                                <Text style={styles.initialText}>{item.user.name?.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
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
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Icon name="users" size={16} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>User Subscriptions</Text>
                        </View>
                        <TouchableOpacity onPress={toggleSearch} style={styles.searchToggle}>
                            <Icon name={showSearch ? "times" : "search"} size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {showSearch && (
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={14} color="#9CA3AF" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by Name, Phone, or Plan..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={true}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Icon name="times-circle" size={14} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                    ) : filteredSubscribers.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="users-slash" size={40} color={COLORS.secondary} />
                            <Text style={styles.emptyText}>{searchQuery ? 'No users matching search.' : 'No subscribers found.'}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredSubscribers}
                            renderItem={renderSubscriber}
                            keyExtractor={item => item.user._id + item.plan._id}
                            scrollEnabled={false}
                        />
                    )}
                </View>
            </ScrollView>

            <LinearGradient
                colors={['rgba(248, 249, 250, 0)', '#f8f9fa']}
                style={styles.bottomFade}
                pointerEvents="none"
            />

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
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => generateStatement(selectedSubscriber, paymentHistory)} style={{ marginRight: 15 }}>
                                    <Icon name="file-download" size={20} color={COLORS.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                                    <Icon name="times" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
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

                                            {item.status === 'Completed' && (
                                                <TouchableOpacity onPress={() => generateInvoice(item, selectedSubscriber)} style={{ marginTop: 5 }}>
                                                    <Icon name="file-invoice" size={14} color={COLORS.primary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    bottomFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        zIndex: 100
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
    // Search Styles
    searchToggle: {
        padding: 5,
        backgroundColor: '#EDF2F7',
        borderRadius: 20,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 46,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 2 }
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.dark,
        height: '100%'
    },
});

export default MerchantUsers;
