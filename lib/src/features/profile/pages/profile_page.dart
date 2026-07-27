import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_strings.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<AppLang>(
      valueListenable: AppLanguage.instance,
      builder: (context, lang, _) {
        final s = AppStrings(lang);
        return Directionality(
          textDirection: AppLanguage.instance.textDirection,
          child: Scaffold(
            backgroundColor: const Color(0xFFF6F8FD),
            body: SingleChildScrollView(
              child: Column(
                children: [
                  // ── Header ──────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      gradient: AppColors.headerGradient,
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(32),
                        bottomRight: Radius.circular(32),
                      ),
                    ),
                    padding: EdgeInsets.only(
                      top: MediaQuery.of(context).padding.top + 16,
                      left: 20,
                      right: 20,
                      bottom: 24,
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            // Avatar
                            Stack(
                              alignment: Alignment.bottomCenter,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(3),
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const CircleAvatar(
                                    radius: 30,
                                    backgroundColor: AppColors.royalBlue,
                                    child: Text(
                                      'M',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ),
                                ),
                                Positioned(
                                  bottom: -4,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.royalBlue,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: Colors.white, width: 1.5),
                                    ),
                                    child: const Text(
                                      '60%',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 14),
                            // Name & phone
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Moncef Azzouz',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '+213 550 123 456',
                                    style: TextStyle(
                                      color: Colors.white.withAlpha(190),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Edit button
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(30),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.edit_outlined,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Rafik Plus banner
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Unlimited free delivery & more!',
                                      style: TextStyle(
                                        color: Color(0xFF1E1E2C),
                                        fontSize: 14,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'As low as 667 DZD per month with Rafik Plus!',
                                      style: TextStyle(
                                        color: Colors.grey.shade700,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        height: 1.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              const Icon(
                                Icons.delivery_dining_rounded,
                                color: AppColors.royalBlue,
                                size: 32,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Quick Actions ────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
                    child: Row(
                      children: [
                        _buildQuickActionCard(icon: Icons.history_rounded, label: s.activityTitle),
                        const SizedBox(width: 10),
                        _buildQuickActionCard(icon: Icons.percent_rounded, label: s.navPromos),
                        const SizedBox(width: 10),
                        _buildQuickActionCard(icon: Icons.location_on_outlined, label: s.profileAccount),
                      ],
                    ),
                  ),

                  // ── Language Picker Card ─────────────────────────────
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(6),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(color: Colors.grey.shade100, width: 1.5),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Section header
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withAlpha(15),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.language_rounded,
                                color: AppColors.primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.profileLanguage,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                Text(
                                  s.profileLanguageSubtitle,
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Language buttons
                        Row(
                          children: [
                            _buildLangButton(
                              lang: lang,
                              target: AppLang.ar,
                              flag: '🇩🇿',
                              label: s.langArabic,
                            ),
                            const SizedBox(width: 8),
                            _buildLangButton(
                              lang: lang,
                              target: AppLang.fr,
                              flag: '🇫🇷',
                              label: s.langFrench,
                            ),
                            const SizedBox(width: 8),
                            _buildLangButton(
                              lang: lang,
                              target: AppLang.en,
                              flag: '🇬🇧',
                              label: s.langEnglish,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // ── Settings Menu ────────────────────────────────────
                  Container(
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(6),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(color: Colors.grey.shade100, width: 1.5),
                    ),
                    child: Column(
                      children: [
                        _buildMenuTile(
                          icon: Icons.person_outline_rounded,
                          label: s.profileAccount,
                          badgeText: lang == AppLang.ar ? 'معلومات ناقصة' : lang == AppLang.fr ? 'Infos manquantes' : 'Missing details',
                          badgeColor: const Color(0xFFFFECE0),
                          badgeTextColor: const Color(0xFFE65100),
                        ),
                        _buildMenuDivider(),
                        _buildMenuTile(
                          icon: Icons.credit_card_rounded,
                          label: s.profilePayment,
                          showArrow: true,
                        ),
                        _buildMenuDivider(),
                        _buildMenuTile(
                          icon: Icons.star_border_rounded,
                          label: lang == AppLang.ar ? 'المفضلة' : lang == AppLang.fr ? 'Favoris' : 'Favorites',
                          showArrow: true,
                        ),
                        _buildMenuDivider(),
                        _buildMenuTile(
                          icon: Icons.add_circle_outline_rounded,
                          label: 'Rafik Plus',
                          iconColor: Colors.pink,
                          badgeText: lang == AppLang.ar ? 'اشترك ووفّر' : lang == AppLang.fr ? 'Abonnez & économisez' : 'Subscribe & save',
                          badgeColor: const Color(0xFFFFECEF),
                          badgeTextColor: Colors.pink,
                        ),
                        _buildMenuDivider(),
                        _buildMenuTile(
                          icon: Icons.chat_bubble_outline_rounded,
                          label: s.profileHelp,
                          showArrow: true,
                        ),
                        _buildMenuDivider(),
                        _buildMenuTile(
                          icon: Icons.exit_to_app_rounded,
                          label: s.profileLogout,
                          iconColor: Colors.red.shade400,
                          showArrow: false,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 110),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ── Language Button ────────────────────────────────────────────
  Widget _buildLangButton({
    required AppLang lang,
    required AppLang target,
    required String flag,
    required String label,
  }) {
    final isSelected = lang == target;
    return Expanded(
      child: GestureDetector(
        onTap: () => AppLanguage.instance.setLanguage(target),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.grey.shade200,
              width: 1.5,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(40),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    )
                  ]
                : null,
          ),
          child: Column(
            children: [
              Text(flag, style: const TextStyle(fontSize: 22)),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionCard({required IconData icon, required String label}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(4),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.deepNavy, size: 26),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuTile({
    required IconData icon,
    required String label,
    Color? iconColor,
    String? badgeText,
    Color? badgeColor,
    Color? badgeTextColor,
    bool showArrow = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Icon(icon, color: iconColor ?? AppColors.deepNavy, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          if (badgeText != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: badgeColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                badgeText,
                style: TextStyle(
                  color: badgeTextColor,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          if (showArrow)
            Icon(Icons.chevron_right_rounded, color: Colors.grey.shade400, size: 22),
        ],
      ),
    );
  }

  Widget _buildMenuDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Divider(height: 1, color: Color(0xFFF1F1F5)),
    );
  }
}
