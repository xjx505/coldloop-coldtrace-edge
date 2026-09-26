package com.coldloop.monitor;

import android.content.res.Configuration;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applySystemTextScale();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        applySystemTextScale();
    }

    private void applySystemTextScale() {
        if (bridge == null || bridge.getWebView() == null) {
            return;
        }
        int textZoom = Math.round(getResources().getConfiguration().fontScale * 100f);
        bridge.getWebView().getSettings().setTextZoom(textZoom);
    }
}
