import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/parcel_order_repository.dart';
import '../domain/parcel_order.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';

class ParcelTrackOrderPage extends StatefulWidget {
  final ParcelOrder order;

  const ParcelTrackOrderPage({super.key, required this.order});

  @override
  State<ParcelTrackOrderPage> createState() => _ParcelTrackOrderPageState();
}

class _ParcelTrackOrderPageState extends State<ParcelTrackOrderPage> {
  static const _pollInterval = Duration(seconds: 12);

  late ParcelOrder _order;
  bool _isCancelling = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
    // The backend has no realtime push — poll while tracking this order so
    // status changes the driver makes (accepted/arrived/delivered/...) show
    // up here without the customer having to leave and reopen the screen.
    if (!_order.isArchived) {
      _pollTimer = Timer.periodic(_pollInterval, (_) => _refreshStatus());
    }
  }

  Future<void> _refreshStatus() async {
    final result = await ParcelOrderRepository.instance.fetchOne(_order.id);
    if (!mounted) return;
    result.fold(
      onSuccess: (order) {
        setState(() => _order = order);
        if (order.isArchived) _pollTimer?.cancel();
      },
      onFailure: (_) {
        // Transient network hiccup — keep showing the last known status and
        // just retry on the next tick.
      },
    );
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  String _formatPrice(num? price) {
    if (price == null) return '—';
    final rounded = price.round();
    final str = rounded.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(',');
      buffer.write(str[i]);
    }
    return '${buffer.toString()} DZD';
  }

  Future<void> _openUrl(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        final s = AppStrings(lang);
        final isRtl = lang == AppLang.ar;
        final stepIndex = parcelStatusStepIndex(_order.status);
        final isCancelled = _order.isCancelled;

        return Directionality(
          textDirection: AppLanguage.instance.textDirection,
          child: Scaffold(
            backgroundColor: const Color(0xFFF7F8FA),
            body: SafeArea(
              child: Column(
                children: [
                  // ── Top Bar ──────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(20),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Icon(
                              isRtl ? Icons.arrow_forward : Icons.arrow_back,
                              color: Colors.black87,
                              size: 22,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(20),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.inventory_2_outlined,
                                color: AppColors.primary,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _order.orderNumber.isNotEmpty
                                    ? _order.orderNumber
                                    : _order.id,
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 40),
                      ],
                    ),
                  ),

                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      children: [
                        // ── Status Banner ──────────────────────────────
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  isCancelled
                                      ? s.parcelStatusCancelled
                                      : _statusLabel(s, _order.status),
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: isCancelled
                                      ? Colors.red.shade50
                                      : Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isCancelled
                                        ? Colors.red.shade200
                                        : Colors.orange.shade200,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                        color: isCancelled
                                            ? Colors.red.shade800
                                            : Colors.orange.shade800,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      isCancelled ? 'ملغي' : 'نشط',
                                      style: TextStyle(
                                        color: isCancelled
                                            ? Colors.red.shade900
                                            : Colors.orange.shade900,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // ── Status Stepper ─────────────────────────────
                        if (!isCancelled)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Column(
                              children: [
                                _buildStepRow(
                                  title: s.parcelStepCreated,
                                  isDone: stepIndex >= 0,
                                  isCurrent: stepIndex == 0,
                                  isLast: false,
                                ),
                                _buildStepRow(
                                  title: s.parcelStepAssigned,
                                  isDone: stepIndex >= 1,
                                  isCurrent: stepIndex == 1,
                                  isLast: false,
                                ),
                                _buildStepRow(
                                  title: s.parcelStepPickedUp,
                                  isDone: stepIndex >= 2,
                                  isCurrent: stepIndex == 2,
                                  isLast: false,
                                ),
                                _buildStepRow(
                                  title: s.parcelStepDelivering,
                                  isDone: stepIndex >= 3,
                                  isCurrent: stepIndex == 3,
                                  isLast: false,
                                ),
                                _buildStepRow(
                                  title: s.parcelStepCompleted,
                                  isDone: stepIndex >= 4,
                                  isCurrent: stepIndex == 4,
                                  isLast: true,
                                ),
                              ],
                            ),
                          ),

                        const SizedBox(height: 20),

                        // ── Map / Navigation Actions ───────────────────
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s.parcelDriverInfo,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildMapActionButton(
                                icon: Icons.alt_route_rounded,
                                label: s.parcelOpenDirections,
                                onTap: () => _openUrl(_order.mapsDirectionsUrl),
                                enabled: _order.mapsDirectionsUrl != null,
                              ),
                              const SizedBox(height: 8),
                              _buildMapActionButton(
                                icon: Icons.storefront_rounded,
                                label: s.parcelOpenPickup,
                                onTap: () => _openUrl(_order.mapsPickupUrl),
                                enabled: _order.mapsPickupUrl != null,
                              ),
                              const SizedBox(height: 8),
                              _buildMapActionButton(
                                icon: Icons.flag_rounded,
                                label: s.parcelOpenDestination,
                                onTap: () =>
                                    _openUrl(_order.mapsDestinationUrl),
                                enabled: _order.mapsDestinationUrl != null,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // ── Route & Order Details Card ────────────────
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      _order.pickupAddress,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              Padding(
                                padding: const EdgeInsets.only(left: 3),
                                child: Container(
                                  width: 2,
                                  height: 16,
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              Row(
                                children: [
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: Colors.black,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      _order.destinationAddress,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'الوصف:',
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 12,
                                    ),
                                  ),
                                  Flexible(
                                    child: Text(
                                      _order.description.isNotEmpty
                                          ? _order.description
                                          : '—',
                                      textAlign: TextAlign.end,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'السعر:',
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                      fontSize: 12,
                                    ),
                                  ),
                                  Text(
                                    _formatPrice(
                                      _order.agreedPrice ??
                                          _order.estimatedPrice,
                                    ),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.primary,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // ── Cancel Order Button ─────────────────────
                        if (!isCancelled && !_order.isDelivered)
                          SizedBox(
                            width: double.infinity,
                            child: TextButton.icon(
                              onPressed: _isCancelling
                                  ? null
                                  : () => _showCancelDialog(context, s),
                              icon: const Icon(
                                Icons.cancel_outlined,
                                color: Colors.red,
                                size: 18,
                              ),
                              label: Text(
                                s.parcelCancelOrder,
                                style: const TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String _statusLabel(AppStrings s, String status) {
    switch (status) {
      case 'requested':
        return s.parcelStatusSearching;
      case 'accepted':
        return s.parcelStatusAssigned;
      case 'arrived':
      case 'loading':
        return s.parcelStatusInTransit;
      case 'in_transit':
        return s.parcelStatusDelivering;
      case 'delivered':
        return s.parcelStatusDelivered;
      default:
        return s.parcelStatusCancelled;
    }
  }

  Widget _buildMapActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool enabled,
  }) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: enabled ? onTap : null,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: BorderSide(
            color: enabled ? AppColors.primary : Colors.grey.shade300,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        icon: Icon(icon, size: 18),
        label: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildStepRow({
    required String title,
    required bool isDone,
    required bool isCurrent,
    required bool isLast,
  }) {
    final color = isDone
        ? AppColors.primary
        : isCurrent
        ? Colors.orange.shade800
        : Colors.grey.shade400;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: isDone ? AppColors.primary : Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                ),
                child: isDone
                    ? const Icon(Icons.check, color: Colors.white, size: 12)
                    : isCurrent
                    ? Center(
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                      )
                    : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    color: isDone
                        ? AppColors.primary.withAlpha(100)
                        : Colors.grey.shade300,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: isDone || isCurrent
                      ? FontWeight.bold
                      : FontWeight.w500,
                  color: isDone || isCurrent
                      ? Colors.black87
                      : Colors.grey.shade500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context, AppStrings s) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(s.parcelCancelOrder),
        content: const Text('هل أنت تأكد من رغبتك في إلغاء هذا الطلب؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              setState(() => _isCancelling = true);
              final result = await ParcelOrderRepository.instance.cancel(
                _order.id,
              );
              if (!mounted) return;
              result.fold(
                onSuccess: (order) {
                  setState(() {
                    _order = order;
                    _isCancelling = false;
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('تم إلغاء الطلب بنجاح')),
                  );
                  Navigator.pop(context);
                },
                onFailure: (failure) {
                  setState(() => _isCancelling = false);
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(failure.message)));
                },
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text(
              'نعم، إلغاء',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
