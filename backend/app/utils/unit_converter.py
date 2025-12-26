VOLUME_TO_TBSP = {'cup': 16, 'tablespoon': 1, 'teaspoon': 1/3}
WEIGHT_TO_GRAMS = {'pound': 453.592, 'ounce': 28.3495, 'gram': 1}
VOLUME_UNITS = {'cup', 'tablespoon', 'teaspoon'}
WEIGHT_UNITS = {'pound', 'ounce', 'gram'}
COUNT_UNITS = {'piece'}
VOLUME_PRIMARY = 'cup'
WEIGHT_PRIMARY = 'gram'
COUNT_PRIMARY = 'piece'


def get_unit_group(unit):
    if not unit:
        return

    if unit in VOLUME_UNITS:
        return 'volume'
    elif unit in WEIGHT_UNITS:
        return 'weight'
    elif unit in COUNT_UNITS:
        return 'count'


def get_convertible_units(unit):
    if not unit:
        return []

    group = get_unit_group(unit)

    if group == 'volume':
        return list(VOLUME_UNITS)
    elif group == 'weight':
        return list(WEIGHT_UNITS)
    elif group == 'count':
        return []

    return []


def convert_unit(quantity, from_unit, to_unit):
    if not quantity or not from_unit or not to_unit:
        return

    if from_unit == to_unit:
        return quantity

    from_group = get_unit_group(from_unit)
    to_group = get_unit_group(to_unit)

    if not from_group or not to_group or from_group != to_group:
        return

    try:
        quantity = float(quantity)
    except (ValueError, TypeError):
        return

    if from_group == 'volume':
        tablespoons = quantity * VOLUME_TO_TBSP[from_unit]
        result = tablespoons / VOLUME_TO_TBSP[to_unit]
    elif from_group == 'weight':
        grams = quantity * WEIGHT_TO_GRAMS[from_unit]
        result = grams / WEIGHT_TO_GRAMS[to_unit]
    else:
        return

    return round(result, 2)


def get_primary_unit(unit):
    group = get_unit_group(unit)

    if group == 'volume':
        return VOLUME_PRIMARY
    elif group == 'weight':
        return WEIGHT_PRIMARY
    elif group == 'count':
        return COUNT_PRIMARY

    return unit


def format_quantity_with_conversions(quantity, unit, include_conversions=False):
    if not quantity or not unit:
        return {
            'quantity': quantity,
            'unit': unit,
            'alternatives': []
        }

    convertible = get_convertible_units(unit)

    result = {
        'quantity': quantity,
        'unit': unit,
        'alternatives': []
    }

    if unit == 'piece':
        return result

    if include_conversions and convertible:
        primary = get_primary_unit(unit)

        if unit != primary:
            primary_qty = convert_unit(quantity, unit, primary)
            if primary_qty:
                result['quantity'] = primary_qty
                result['unit'] = primary

        for alt_unit in convertible:
            if alt_unit != result['unit']:
                alt_qty = convert_unit(result['quantity'], result['unit'], alt_unit)
                if alt_qty:
                    result['alternatives'].append({
                        'quantity': alt_qty,
                        'unit': alt_unit
                    })

    return result
