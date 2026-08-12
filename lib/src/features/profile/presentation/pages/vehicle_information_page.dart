import 'package:flutter/material.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../orders/data/truck_repository.dart';

class _TruckType {
  final String id;
  final String name;
  final String? capacityLabel;

  const _TruckType({required this.id, required this.name, this.capacityLabel});

  factory _TruckType.fromJson(Map<String, dynamic> json) => _TruckType(
    id: json['id'].toString(),
    name: json['name'] as String? ?? 'Truck',
    capacityLabel: json['capacityLabel'] as String?,
  );
}

class VehicleInformationPage extends StatefulWidget {
  const VehicleInformationPage({super.key});

  @override
  State<VehicleInformationPage> createState() => _VehicleInformationPageState();
}

class _VehicleInformationPageState extends State<VehicleInformationPage> {
  late final _plateController = TextEditingController(
    text: TruckRepository.instance.truck?.plate ?? '',
  );

  bool _loadingTruckTypes = true;
  String? _truckTypesError;
  List<_TruckType> _truckTypes = [];
  String? _selectedTruckTypeId;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _selectedTruckTypeId = TruckRepository.instance.truck?.truckTypeId;
    _loadTruckTypes();
  }

  Future<void> _loadTruckTypes() async {
    final result = await ApiClient.instance.get('/api/truck/types');
    if (!mounted) return;
    result.fold(
      onSuccess: (value) {
        setState(() {
          _truckTypes = (value as List)
              .cast<Map<String, dynamic>>()
              .map(_TruckType.fromJson)
              .toList();
          _loadingTruckTypes = false;
        });
      },
      onFailure: (failure) {
        setState(() {
          _loadingTruckTypes = false;
          _truckTypesError = failure.message;
        });
      },
    );
  }

  @override
  void dispose() {
    _plateController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final truck = TruckRepository.instance.truck;
    if (truck == null) return;

    setState(() => _isSaving = true);

    final result = await ApiClient.instance.put(
      '/api/truck/trucks/${truck.id}',
      body: {
        if (_selectedTruckTypeId != null) 'truckTypeId': _selectedTruckTypeId,
        'plate': _plateController.text.trim(),
      },
    );

    if (!mounted) return;
    setState(() => _isSaving = false);

    result.fold(
      onSuccess: (_) async {
        await TruckRepository.instance.refreshTruckProfile();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vehicle information saved')),
        );
      },
      onFailure: (failure) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(failure.message)));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final truck = TruckRepository.instance.truck;
    return Scaffold(
      appBar: AppBar(title: const Text('Vehicle information')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 30),
        children: [
          Container(
            height: 190,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(25),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.local_shipping_rounded,
                  color: Colors.white,
                  size: 88,
                ),
                const SizedBox(height: 8),
                Text(
                  truck?.truckTypeName ?? 'No truck type set',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  truck?.plate ?? truck?.truckCode ?? '',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Truck type',
            style: TextStyle(
              color: AppColors.ink,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          _buildTruckTypePicker(),
          const SizedBox(height: 22),
          _plateField(),
          const SizedBox(height: 14),
          FilledButton(
            onPressed: _isSaving ? null : _save,
            style: FilledButton.styleFrom(backgroundColor: AppColors.royalBlue),
            child: _isSaving
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: Colors.white,
                    ),
                  )
                : const Text('Save vehicle'),
          ),
        ],
      ),
    );
  }

  Widget _buildTruckTypePicker() {
    if (_loadingTruckTypes) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 14),
        child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
      );
    }
    if (_truckTypesError != null) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.red.withAlpha(15),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Text(
          'Could not load truck types: $_truckTypesError',
          style: const TextStyle(color: AppColors.red),
        ),
      );
    }
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final type in _truckTypes)
          ChoiceChip(
            label: Text(
              type.capacityLabel != null
                  ? '${type.name} · ${type.capacityLabel}'
                  : type.name,
            ),
            selected: _selectedTruckTypeId == type.id,
            onSelected: (_) => setState(() => _selectedTruckTypeId = type.id),
            selectedColor: AppColors.royalBlue.withAlpha(25),
            labelStyle: TextStyle(
              color: _selectedTruckTypeId == type.id
                  ? AppColors.royalBlue
                  : AppColors.textSecondary,
              fontWeight: FontWeight.w800,
            ),
            side: BorderSide(
              color: _selectedTruckTypeId == type.id
                  ? AppColors.royalBlue
                  : AppColors.line,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
      ],
    );
  }

  Widget _plateField() => TextField(
    controller: _plateController,
    decoration: InputDecoration(
      labelText: 'Plate',
      prefixIcon: const Icon(
        Icons.confirmation_number_outlined,
        color: AppColors.royalBlue,
      ),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(17),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(17),
        borderSide: const BorderSide(color: AppColors.line),
      ),
    ),
  );
}
