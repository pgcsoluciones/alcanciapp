// web/src/lib/assets.js

// ---------- Path builders ----------
export const ASSET = {
    goal: (filename, size = 256) => `/assets/icons/goals/${size}/${filename}`,
    badge: (filename, size = 256) => `/assets/icons/badges/${size}/${filename}`,
    bg: (filename) => `/assets/bg/ui/${filename}`,
    mascot: (filename, size = 256) => `/assets/mascot/${size}/${filename}`,
    logo: (filename = "logo_main.png") => `/assets/logo/${filename}`,
};

// ---------- Existing files (DO NOT RENAME) ----------

// Goals (20)
export const GOAL_FILES = [
    "goal_aesthetic_surgery_female.png",
    "goal_aesthetic_surgery_male.png",
    "goal_appliances.png",
    "goal_baby.png",
    "goal_business.png",
    "goal_car.png",
    "goal_custom.png",
    "goal_debt_free.png",
    "goal_emergency_fund.png",
    "goal_family.png",
    "goal_gadgets.png",
    "goal_gift.png",
    "goal_health.png",
    "goal_home_improvement.png",
    "goal_house.png",
    "goal_investments.png",
    "goal_motorcycle.png",
    "goal_studies.png",
    "goal_vacation.png",
    "goal_wedding.png",
];

// Badges (22)
export const BADGE_FILES = [
    "badge_budget_captain.png",
    "badge_daily_training.png",
    "badge_entrepreneur_titan.png",
    "badge_extreme_bmx.png",
    "badge_extreme_climb.png",
    "badge_extreme_race.png",
    "badge_extreme_skydiving.png",
    "badge_extreme_surf.png",
    "badge_farmer_pro_trophy.png",
    "badge_first_goal.png",
    "badge_grand_progress_cup.png",
    "badge_iron_streak.png",
    "badge_level_up.png",
    "badge_no_excuses.png",
    "badge_saving_champion.png",
    "badge_saving_sprint.png",
    "badge_savings_takeoff.png",
    "badge_seed_brave.png",
    "badge_startup_spark.png",
    "badge_steady_harvest.png",
    "badge_streak_lifeline.png",
    "badge_vault_premium.png",
];

// Mascot poses (16)
export const MASCOT_FILES = [
    "mascot_announce.png",
    "mascot_cheer.png",
    "mascot_dash.png",
    "mascot_goal.png",
    "mascot_guide.png",
    "mascot_happy.png",
    "mascot_hero.png",
    "mascot_level_unlocked.png",
    "mascot_levelup.png",
    "mascot_map.png",
    "mascot_motorcycle_ride.png",
    "mascot_reward.png",
    "mascot_run.png",
    "mascot_sad.png",
    "mascot_stats.png",
    "mascot_think.png",
];

// Backgrounds
export const BG_FILES = [
    "bg_ui_circle_roundtable.jpg",
    "bg_ui_contribute_night_path.jpg",
    "bg_ui_goal_island_day.jpg",
    "bg_ui_goals_garage.jpg",
    "bg_ui_home_sunrise.jpg",
    "bg_ui_journey_path_day.jpg",
    "bg_ui_profile_social_view.jpg",
    "bg_ui_statistics_room.jpg",
];

// Logo
export const LOGO_MAIN = "logo_main.png";

// ---------- Optional: dev-only asset existence check ----------
export function devAssertAssetListUnique(list, label = "assets") {
    if (import.meta?.env?.DEV) {
        const s = new Set(list);
        if (s.size !== list.length) {
            console.warn(`[${label}] duplicate filenames detected`, list);
        }
    }
}
devAssertAssetListUnique(GOAL_FILES, "GOAL_FILES");
devAssertAssetListUnique(BADGE_FILES, "BADGE_FILES");
devAssertAssetListUnique(MASCOT_FILES, "MASCOT_FILES");
