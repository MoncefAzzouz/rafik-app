import 'package:flutter/material.dart';

/// Supported languages
enum AppLang { ar, fr, en }

/// Singleton language controller — any widget can read or change the language.
class AppLanguage extends ValueNotifier<AppLang> {
  AppLanguage._() : super(AppLang.en); // English by default

  static final AppLanguage instance = AppLanguage._();

  void setLanguage(AppLang lang) {
    value = lang;
  }

  String get languageCode {
    switch (value) {
      case AppLang.ar:
        return 'ar';
      case AppLang.fr:
        return 'fr';
      case AppLang.en:
        return 'en';
    }
  }

  // Direction follows language selection
  TextDirection get textDirection =>
      value == AppLang.ar ? TextDirection.rtl : TextDirection.ltr;
}

/// All UI strings mapped to the 3 supported languages.
class AppStrings {
  final AppLang lang;
  const AppStrings(this.lang);

  static AppStrings of(BuildContext context) {
    return AppStrings(AppLanguage.instance.value);
  }

  // ── General ──────────────────────────────────────────────────
  String get appName => _s('رافيك', 'Rafik', 'Rafik');
  String get hello => _s('مرحباً', 'Bonjour', 'Hello');
  String get orderNow => _s('اطلب الآن', 'Commander', 'Order Now');
  String get bookNow => _s('احجز الآن', 'Réserver', 'Book Now');
  String get sendNow => _s('أرسل الآن', 'Envoyer', 'Send Now');
  String get requestAgain => _s('طلب مجدداً', 'Re-commander', 'Request again');
  String get cancel => _s('إلغاء', 'Annuler', 'Cancel');
  String get confirm => _s('تأكيد', 'Confirmer', 'Confirm');
  String get save => _s('حفظ', 'Enregistrer', 'Save');
  String get next => _s('التالي', 'Suivant', 'Next');
  String get back => _s('رجوع', 'Retour', 'Back');
  String get search => _s('بحث', 'Rechercher', 'Search');
  String get noResults => _s('لا توجد نتائج', 'Aucun résultat', 'No results');

  // ── Bottom Nav ────────────────────────────────────────────────
  String get navHome => _s('الرئيسية', 'Accueil', 'Home');
  String get navPromos => _s('عروض', 'Promos', 'Promos');
  String get navActivities => _s('النشاطات', 'Activités', 'Activities');
  String get navProfile => _s('حسابي', 'Profil', 'Profile');

  // ── Home Page ─────────────────────────────────────────────────
  String get homeGreeting =>
      _s('مرحباً، Moncef', 'Bonjour, Moncef', 'Hello, Moncef');
  String get homeServices => _s('خدماتنا', 'Nos services', 'Our Services');
  String get homeTaxi => _s('تاكسي', 'Taxi', 'Taxi');
  String get homeFood => _s('الطعام', 'Nourriture', 'Food');
  String get homeParcel => _s('نقل طرود', 'Colis', 'Parcel');
  String get homeElectrician => _s('كهربائي', 'Électricien', 'Electrician');
  String get homeMore => _s('المزيد', 'Plus', 'More');

  // ── Activity Page ─────────────────────────────────────────────
  String get activityTitle => _s('النشاطات', 'Activités', 'Activity');
  String get activityTabRides => _s('رحلات', 'Trajets', 'Rides');
  String get activityTabFood => _s('طعام', 'Nourriture', 'Food');
  String get activityTabParcel => _s('طرود', 'Colis', 'Parcel');
  String get activityTabShop => _s('تسوق', 'Courses', 'Shop');
  String get activityTabMarket => _s('خدمات', 'Services', 'Market');
  String get activityFilterAll => _s('الكل', 'Tout', 'All');
  String get activityFilterCompleted => _s('مكتمل', 'Terminé', 'Completed');
  String get activityFilterScheduled => _s('مجدول', 'Planifié', 'Scheduled');
  String get activityFilterCancelled => _s('ملغي', 'Annulé', 'Cancelled');
  String get activityEmpty => _s(
    'لا توجد نشاطات سابقة',
    'Aucune activité passée',
    'No previous activities found',
  );

  // ── Profile Page ──────────────────────────────────────────────
  String get profileTitle => _s('حسابي', 'Mon Profil', 'My Profile');
  String get profileLanguage => _s('اللغة', 'Langue', 'Language');
  String get profileLanguageSubtitle =>
      _s('اختر لغة التطبيق', 'Choisir la langue', 'Choose app language');
  String get profileAccount =>
      _s('معلومات الحساب', 'Informations du compte', 'Account Info');
  String get profileOrders => _s('طلباتي', 'Mes commandes', 'My Orders');
  String get profilePayment =>
      _s('طرق الدفع', 'Moyens de paiement', 'Payment Methods');
  String get profileNotifications =>
      _s('الإشعارات', 'Notifications', 'Notifications');
  String get profileHelp =>
      _s('مساعدة ودعم', 'Aide & support', 'Help & Support');
  String get profileLogout => _s('تسجيل الخروج', 'Déconnexion', 'Log Out');

  // Edit Profile
  String get editProfile =>
      _s('تعديل الملف الشخصي', 'Modifier le profil', 'Edit Profile');
  String get editProfilePhoto =>
      _s('تغيير الصورة', 'Changer la photo', 'Change photo');
  String get editProfileName => _s('الاسم الكامل', 'Nom complet', 'Full name');
  String get editProfilePhone =>
      _s('رقم الهاتف', 'Numéro de téléphone', 'Phone number');
  String get editProfileEmail =>
      _s('البريد الإلكتروني', 'Adresse e-mail', 'Email address');
  String get editProfileSave =>
      _s('حفظ التغييرات', 'Enregistrer', 'Save changes');

  // ── Parcel Dashboard ──────────────────────────────────────────
  String get parcelTitle =>
      _s('نقل الطرود', 'Transport de colis', 'Parcel Transport');
  String get parcelEmpty =>
      _s('لا يوجد طلب!', 'Aucune commande!', 'No orders!');
  String get parcelEmptyHint => _s(
    'ليس لديك أي طلبات نشطة. أنشئ طلباً جديداً الآن',
    'Vous n\'avez aucune commande active. Créez-en une maintenant.',
    'You have no active orders. Create a new one now.',
  );
  String get parcelCreateOrder =>
      _s('إنشاء طلب', 'Créer une commande', 'Create Order');
  String get parcelTabHome => _s('الرئيسية', 'Accueil', 'Home');
  String get parcelTabArchive => _s('الأرشيف', 'Archives', 'Archive');
  String get parcelStatusSearching => _s(
    'جاري البحث عن عروض...',
    'Recherche d\'offres...',
    'Searching for offers...',
  );
  String get parcelComplete =>
      _s('إتمام التوصيل', 'Terminer la livraison', 'Complete Delivery');
  String get parcelCancelOrder =>
      _s('إلغاء الطلب', 'Annuler la commande', 'Cancel Order');
  String get parcelArchiveEmpty =>
      _s('الأرشيف فارغ!', 'Archive vide!', 'Archive is empty!');
  String get parcelReorder => _s('إعادة الطلب', 'Re-commander', 'Reorder');

  // ── Parcel Categories ─────────────────────────────────────────
  String get parcelNewOrder => _s('طلب جديد', 'Nouvelle commande', 'New order');
  String get catHouseMoving => _s('نقل منزل', 'Déménagement', 'House moving');
  String get catCommercial =>
      _s('بضائع تجارية', 'Marchandise commerciale', 'Commercial merchandise');
  String get catAppliances =>
      _s('أجهزة كهرومنزلية', 'Électroménager', 'Appliances');
  String get catTowing => _s('قطر وسحب', 'Remorquage', 'Towing');
  String get catConstruction =>
      _s('مواد البناء', 'Matériaux de construction', 'Construction materials');
  String get catHeavyEquipment =>
      _s('معدات ثقيلة', 'Équipement lourd', 'Heavy equipment');
  String get catRefrigerated => _s(
      'بضائع مبرّدة', 'Marchandise réfrigérée', 'Refrigerated merchandise');
  String get catWater => _s('مياه وخزانات', 'Eau', 'Water');
  String get catFuelsChemicals => _s(
      'وقود ومواد كيميائية', 'Carburants & chimie', 'Fuels and chemicals');
  String get catOther => _s('أخرى', 'Autre', 'Other');

  // ── Parcel Vehicles ───────────────────────────────────────────
  String get vehicleTypeTitle =>
      _s('نوع المركبة', 'Type de véhicule', 'Vehicle type');
  String get vehicleTypeSubtitle => _s(
        'اختر نوع الشاحنة المناسب لشحنتك',
        'Choisissez le véhicule adapté à votre cargaison',
        'Choose the vehicle suitable for your cargo',
      );
  String get vehHarbin => _s('هاربين', 'Harbin', 'Harbin');
  String get vehFourgon => _s('فورغون', 'Fourgon', 'Fourgon');
  String get vehTruck => _s('شاحنة مغلقة', 'Camion', 'Truck');
  String get vehMoto => _s('دراجة نارية', 'Moto', 'Motorcycle');

  // ── Language names ────────────────────────────────────────────
  String get langArabic => _s('العربية', 'Arabe', 'Arabic');
  String get langFrench => _s('الفرنسية', 'Français', 'French');
  String get langEnglish => _s('الإنجليزية', 'Anglais', 'English');

  // ── Internal helper ───────────────────────────────────────────
  String _s(String ar, String fr, String en) {
    switch (lang) {
      case AppLang.ar:
        return ar;
      case AppLang.fr:
        return fr;
      case AppLang.en:
        return en;
    }
  }
}
