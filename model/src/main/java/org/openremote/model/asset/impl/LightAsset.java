/*
 * Copyright 2020, OpenRemote Inc.
 *
 * See the CONTRIBUTORS.txt file in the distribution for a
 * full listing of individual contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
package org.openremote.model.asset.impl;

import org.openremote.model.asset.Asset;
import org.openremote.model.asset.AssetDescriptor;
import org.openremote.model.value.AttributeDescriptor;
import org.openremote.model.value.ValueConstraint;
import org.openremote.model.value.ValueFormat;
import org.openremote.model.value.ValueType;
import org.openremote.model.value.impl.ColourRGB;

import javax.persistence.Entity;
import java.util.Optional;

import static org.openremote.model.Constants.UNITS_KELVIN;
import static org.openremote.model.Constants.UNITS_PERCENTAGE;

@Entity
public class LightAsset extends Asset<LightAsset> {

    public static final AttributeDescriptor<Boolean> ON_OFF = new AttributeDescriptor<>("onOff", ValueType.BOOLEAN).withFormat(ValueFormat.BOOLEAN_ON_OFF());
    public static final AttributeDescriptor<Integer> BRIGHTNESS = new AttributeDescriptor<>("brightness", ValueType.POSITIVE_INTEGER)
        .withUnits(UNITS_PERCENTAGE)
        .withConstraints(new ValueConstraint.Min(0), new ValueConstraint.Max(100))
        .withFormat(new ValueFormat().setAsSlider(true));
    public static final AttributeDescriptor<ColourRGB> COLOUR_RGB = new AttributeDescriptor<>("colourRGB", ValueType.COLOUR_RGB);
    public static final AttributeDescriptor<Integer> COLOUR_TEMPERATURE = new AttributeDescriptor<>("colourTemperature", ValueType.POSITIVE_INTEGER)
        .withUnits(UNITS_KELVIN);
    public static final AssetDescriptor<LightAsset> DESCRIPTOR = new AssetDescriptor<>("lightbulb", "e6688a", LightAsset.class);

    /**
     * For use by hydrators (i.e. JPA/Jackson)
     */
    LightAsset() {
        this(null);
    }

    public LightAsset(String name) {
        super(name);
    }

    public Optional<Boolean> getOnOff() {
        return getAttributes().getValue(ON_OFF);
    }

    @SuppressWarnings("unchecked")
    public <T extends LightAsset> T setOnOff(Boolean value) {
        getAttributes().getOrCreate(ON_OFF).setValue(value);
        return (T)this;
    }

    public Optional<Integer> getBrightness() {
        return getAttributes().getValue(BRIGHTNESS);
    }

    @SuppressWarnings("unchecked")
    public <T extends LightAsset> T setBrightness(Integer value) {
        getAttributes().getOrCreate(BRIGHTNESS).setValue(value);
        return (T)this;
    }

    public Optional<ColourRGB> getColourRGB() {
        return getAttributes().getValue(COLOUR_RGB);
    }

    @SuppressWarnings("unchecked")
    public <T extends LightAsset> T setColourRGB(ColourRGB value) {
        getAttributes().getOrCreate(COLOUR_RGB).setValue(value);
        return (T)this;
    }

    public Optional<Integer> getTemperature() {
        return getAttributes().getValue(COLOUR_TEMPERATURE);
    }

    @SuppressWarnings("unchecked")
    public <T extends LightAsset> T setTemperature(Integer value) {
        getAttributes().getOrCreate(COLOUR_TEMPERATURE).setValue(value);
        return (T)this;
    }
}
