import {Config} from "@remotion/cli/config";

Config.overrideFps(30);
Config.overrideWidth(1920);
Config.overrideHeight(1080);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setOutputLocation("out/");
